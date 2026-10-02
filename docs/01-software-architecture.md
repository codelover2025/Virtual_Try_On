# 01 - Complete Software Architecture

## 1. Product Intent

A multi-tenant-ready SaaS web platform where shoppers browse jewellery, open a device camera, virtually wear SKUs in real time, capture frames, and download results. Admins manage catalog, assets, users, and platform settings.

**Experience analogs:** Flipkart / Myntra / Lenskart Virtual Try-On - catalog-first, camera-second, capture-and-share last.

---

## 2. Overall System Design

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER (Browsers)                            │
│  ┌─────────────────────┐              ┌────────────────────────────────┐ │
│  │  apps/web (Customer)│              │  apps/admin (Operations)       │ │
│  │  Catalog | Try-On   │              │  Products | Users | Settings   │ │
│  │  Capture | Download │              │  Assets | Analytics | Audit    │ │
│  └──────────┬──────────┘              └───────────────┬────────────────┘ │
│             │ HTTPS / REST + JWT                       │ HTTPS / REST + JWT│
└─────────────┼──────────────────────────────────────────┼───────────────────┘
              │                                          │
┌─────────────▼──────────────────────────────────────────▼───────────────────┐
│                         EDGE TIER                                          │
│  Nginx (TLS termination, reverse proxy, gzip, rate limit, static cache)    │
└─────────────┬──────────────────────────────────────────┬───────────────────┘
              │                                          │
┌─────────────▼──────────────────────────────────────────▼───────────────────┐
│                      APPLICATION TIER - apps/api (NestJS)                  │
│  Auth | Catalog | Uploads | TryOn Sessions | Capture | Settings            │
│  Analytics | RBAC | Audit | Health                                         │
└──────────────────────────────────┬─────────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌───────────────┐        ┌─────────────────┐        ┌────────────────────┐
│  PostgreSQL   │        │  Redis          │        │  Object Storage    │
│  System of    │        │  Cache | RL     │        │  MinIO / R2        │
│  record       │        │  Queues         │        │  Images | Assets   │
│  Prisma       │        │  Idempotency    │        │  Captures          │
└───────────────┘        └─────────────────┘        └────────────────────┘

BROWSER-LOCAL AR (no server GPU for core try-on)
┌──────────────────────────────────────────────────────────────────────────┐
│  packages/ar-engine                                                      │
│  Camera -> TF.js -> Landmarks -> Alignment -> Canvas / Three.js / WebGL      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Design Principles

| Principle | Application |
|-----------|-------------|
| **Client-side AR** | Detection + overlay in browser; API stores sessions/captures/metadata. Scales without GPU farms. |
| **API as contract** | NestJS owns auth, catalog, assets, RBAC, persistence. |
| **Deployable split** | `web`, `admin`, `api` independent; shared typed packages only. |
| **Data-driven jewellery** | Kind + AnchorProfile + asset pipeline - not hardcoded per SKU type. |
| **Fail soft** | CV failures -> retry / manual place; never corrupt catalog or auth. |

---

## 3. Layered Architecture

```
L7 Presentation     Next.js pages, layouts, R3F canvas
L6 Application UI   Feature hooks, Zustand stores
L5 Domain Clients   TanStack Query, API client
L4 Cross-cutting    Auth, errors, analytics, logging
L3 API Surface      NestJS controllers + Swagger
L2 Domain Services  Business rules, orchestration
L1 Persistence      Prisma repos, Redis, object storage
L0 Infrastructure   Docker, Nginx, CI/CD, Ubuntu
```

AR Engine sits beside L6/L7 as a subdomain package consumed by `apps/web` (admin preview optional).

---

## 4. Module Communication

### Backend (NestJS)

```
AuthModule -> UsersModule, RolesModule
ProductsModule -> CategoriesModule, JewelleryAssetsModule, UploadsModule
TryOnModule -> ProductsModule, UploadsModule, UsersModule
SettingsModule -> AuditModule
AnalyticsModule -> TryOnModule (read aggregates)
UploadsModule -> StorageAdapter (MinIO | R2)
```

Rules: Controllers never use Prisma directly. Services depend on repository interfaces via DI. Cross-module writes only through exported services.

### Frontend

```
web/catalog -> ProductCard, Query keys
web/try-on -> packages/ar-engine, packages/hooks
web/account -> auth store, JWT refresh
admin/* -> same API client + admin routes
```

### Shared packages (merge-conflict firewall)

| Package | Primary owner | Consumers |
|---------|---------------|-----------|
| `packages/types` | Contract PRs (both) | web, admin, api |
| `packages/shared` | Both | utils, constants, zod |
| `packages/ui` | Engineer B | web, admin |
| `packages/config` | Engineer A | eslint, tsconfig, tailwind |
| `packages/ar-engine` | Engineer B exclusive | web |
| `packages/api-client` | Generated / shared | web, admin |

---

## 5. Data Flow

### Catalog browse

```
User -> Next.js SSR/ISR -> GET /products -> Prisma -> PostgreSQL
     -> DTO + signed image URLs -> TanStack Query -> UI
```

### Try-on (real time, browser-local)

```
Select product -> Load JewelleryAsset + overlay URLs
-> Camera permission -> Video stream
-> TF.js face/hand inference -> Landmark smoothing
-> Anchor resolution -> Scale/rotate -> Canvas2D and/or Three.js @ 24-30 FPS
```

### Capture & download

```
Capture -> Composite freeze frame -> POST capture
-> Object storage -> CapturedImage row -> Signed URL -> Download
```

### Admin publish

```
Upload images + asset -> Storage -> Product + Images + JewelleryAsset
-> Publish flag -> Redis invalidate product:* -> AuditLog
```

---

## 6. Request Flow (Authenticated API)

```
Client -> Nginx (TLS, rate limit)
-> Nest Middleware (requestId)
-> Guards (JWT, Roles, Permissions)
-> ValidationPipe
-> Controller -> Service -> Repository / Redis / Storage
-> Interceptor (envelope) -> Exception Filter -> Client
```

**Success envelope**

```json
{
  "success": true,
  "data": {},
  "meta": { "requestId": "uuid", "timestamp": "ISO-8601" }
}
```

**Error envelope**

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Human readable",
    "details": []
  },
  "meta": { "requestId": "uuid", "timestamp": "ISO-8601" }
}
```

---

## 7. AR Engine Flow

```
getUserMedia -> Frame Grabber (rAF / requestVideoFrameCallback)
-> Preprocess (resize, mirror) -> Model Router (by JewelleryKind)
-> FaceDetector and/or HandDetector (TF.js)
-> Landmark Processor (EMA, outlier reject, confidence gate)
-> Anchor Solver (earL/R, finger, neck, nose, wrist)
-> Pose Fit (scale, rotation, depth hint)
-> Renderer (Canvas2D and/or Three.js / R3F / WebGL)
-> Capture Compositor (PNG/JPEG)
```

### JewelleryKind -> Anchor Profile (extensible registry)

| Kind | Primary landmarks | Secondary |
|------|-------------------|-----------|
| EARRINGS | Face ear points | Face scale (IPD / jaw) |
| NECKLACE | Chin / jaw / neck proxy | Shoulder estimate |
| RINGS | Hand finger joints | Finger width |
| BANGLES | Wrist landmarks | Forearm scale |
| NOSE_RING | Nose tip / nostril | Face scale |
| Future kinds | Extend AnchorProfile only | No product-module fork |

---

## 8. Deployment Topology (Summary)

```
Internet -> Nginx :443 -> web:3000 | admin:3001 | api:4000
                      -> postgres | redis | minio
```

Environments: development (compose), staging (parity), production (hardened Ubuntu). Full detail in doc 09.

---

## 9. Scalability & Reliability

| Concern | Strategy |
|---------|----------|
| API scale | Stateless NestJS; JWT; Redis shared cache/blacklist |
| Catalog reads | Redis + CDN images; Next.js ISR/SSR |
| Try-on CPU | Client TF.js; quantized models; adaptive resolution |
| Uploads | Presigned direct-to-storage URLs |
| DB | Indexes; pooling; read replica later |
| Ops | Health checks, restart policies, backups, object versioning |

---

## 10. Security (High Level)

- Access + refresh JWT; rotation; optional HttpOnly cookies
- RBAC Role -> Permissions on all mutating admin routes
- Soft delete; signed object URLs with short TTL
- Rate-limit auth/upload; CORS allowlist; Helmet; payload limits
- Audit admin mutations; minimize PII (no raw video by default)

---

## 11. Observability

- Structured JSON logs + `requestId`
- Prometheus-compatible `/metrics`
- Client try-on telemetry: FPS, model load, confidence (sampled)

---

## 12. Explicitly Out of Scope (v1)

- MediaPipe / paid AR SDKs
- Native mobile apps (responsive web first)
- Server-side GPU inference for try-on
- Multi-vendor checkout marketplace
- Full-body / outfit try-on
