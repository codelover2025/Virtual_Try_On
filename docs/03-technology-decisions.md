# 03 - Technology Decisions

Format: Context -> Decision -> Why -> Consequences. Stack is **strict** per product requirements.

---

## Why NestJS?

**Context:** Need a modular, typed Node API with DI, guards, Swagger, and clear module boundaries for a SaaS backend.

**Decision:** NestJS on Node.js as the sole API runtime.

**Why:**
- First-class Dependency Injection -> Repository Pattern + SOLID without custom DI containers
- Module isolation matches Products / Auth / TryOn / Uploads ownership
- Built-in ValidationPipe, Guards, Interceptors, Exception Filters
- Swagger/OpenAPI out of the box -> contract for two frontend apps
- Familiar Express underlay; huge ecosystem

**Consequences:** Slightly more boilerplate than Express; payoff is maintainability and parallel module work.

---

## Why Next.js 15?

**Context:** Customer + admin web UIs need SEO-friendly catalog, fast UX, and App Router layouts.

**Decision:** Next.js 15 (App Router) with React 19 for `apps/web` and `apps/admin`.

**Why:**
- SSR/ISR for product listing and SEO
- Route groups for marketing / shop / try-on without routing chaos
- Server Components for catalog shells; Client Components for camera/AR
- Mature deployment story behind Nginx
- TypeScript-first DX with React 19

**Consequences:** Keep AR and camera logic strictly in Client Components; do not attempt TF.js on the server.

---

## Why PostgreSQL?

**Context:** Relational data with RBAC, catalog integrity, sessions, captures, audit.

**Decision:** PostgreSQL as system of record.

**Why:**
- Strong consistency for inventory/catalog and permissions
- UUID, JSONB (anchor profiles, settings), full-text later
- Mature backup/replication story
- Excellent Prisma support

**Consequences:** Not a document DB - complex nested AR configs live in JSONB columns with schema validation at app layer.

---

## Why Redis?

**Context:** Hot reads, rate limits, short-lived tokens/blacklist, optional job queues.

**Decision:** Redis beside PostgreSQL.

**Why:**
- Cache product/category payloads and settings
- Rate-limit auth and upload endpoints
- Refresh-token revocation / session blacklist
- Future: BullMQ for async image processing / analytics rollups

**Consequences:** Cache invalidation discipline required on product publish/update.

---

## Why TensorFlow.js?

**Context:** Real-time jewellery try-on in-browser without MediaPipe or paid AR SDKs.

**Decision:** TensorFlow.js for face/hand detection and landmark inference.

**Why:**
- Runs in browser (WebGL / WASM backends)
- Open-source models available (face landmarks, hand pose)
- No server GPU cost for core UX
- Fits “free open-source only” constraint

**Consequences:** Model selection/quantization and performance tuning are product-critical; must handle unsupported browsers gracefully.

---

## Why OpenCV.js?

**Context:** Need lightweight image ops (resize, color, morphology helpers) without a commercial CV stack.

**Decision:** OpenCV.js as optional helper for preprocessing / geometry utilities - not as the primary detector.

**Why:** Complements TF.js; useful for capture post-process and calibration helpers.

**Consequences:** Keep WASM payload lazy-loaded; do not block first paint on OpenCV.

---

## Why Three.js + React Three Fiber + Drei + WebGL?

**Context:** Realistic jewellery overlay (metal/refraction-ish materials, depth, 3D assets) beyond flat PNG stickers.

**Decision:** Three.js via React Three Fiber + Drei for 3D jewellery assets; Canvas2D path retained for lightweight 2D overlays.

**Why:**
- Industry-standard WebGL engine, fully OSS
- R3F maps Three to React lifecycle in Next client components
- Drei helpers (loaders, environment, controls) speed delivery
- Supports GLB/glTF jewellery assets from admin uploads

**Consequences:** Dual renderer strategy (2D + 3D) selected per asset type; must budget GPU on mid-range mobiles.

---

## Why Prisma?

**Context:** Type-safe DB access with migrations for a NestJS codebase.

**Decision:** Prisma ORM + migrate + seed.

**Why:**
- Schema-as-code; excellent TypeScript types
- Migrations fit CI
- Soft-delete middleware patterns are well understood
- Fits Repository Pattern (Prisma client wrapped, not leaked to controllers)

**Consequences:** Complex analytics SQL may use `$queryRaw` carefully; avoid N+1 via includes.

---

## Why Docker + Docker Compose + Nginx + Ubuntu?

**Context:** Reproducible deploys across dev/staging/prod on a Linux host.

**Decision:** Containerize all services; Nginx as reverse proxy; Ubuntu as host OS; GitHub Actions for CI/CD.

**Why:**
- Parity between environments
- Nginx for TLS, routing, gzip, static caching, rate limits
- Compose for single-host SaaS v1; path to Swarm/K8s later without redesigning apps
- GH Actions integrates with PR-based git strategy

**Consequences:** Secrets via env/files - never bake into images; multi-stage builds for small images.

---

## Why TanStack Query + Zustand?

**Decision:** TanStack Query for server state; Zustand for ephemeral UI/AR session state.

**Why:** Clear split - cache/invalidate API data vs camera/session UI flags. Avoids Redux boilerplate.

---

## Why Tailwind + shadcn/ui + Framer Motion?

**Decision:** Tailwind for utility styling; shadcn for accessible primitives; Framer Motion for intentional motion (entrance, try-on CTA, capture feedback).

**Why:** Fast consistent UI across web/admin via `packages/ui`; motion used for presence, not noise.

---

## Why JWT Authentication?

**Decision:** Access + refresh JWT with rotation; RBAC claims or DB-backed permission checks on sensitive routes.

**Why:** Stateless API scaling; works for web + admin; refresh enables revocation patterns with Redis blacklist.

---

## Why MinIO / Cloudflare R2?

**Decision:** S3-compatible object storage for product images, jewellery assets, captures.

**Why:**
- MinIO for self-host/dev parity
- R2 for production CDN-friendly egress economics
- Same adapter interface (`StoragePort`) - swap via env

---

## Rejected / Forbidden Options

| Option | Reason |
|--------|--------|
| MediaPipe | Explicitly forbidden |
| Paid AR SDKs (8th Wall, DeepAR, etc.) | Cost + lock-in + policy |
| MongoDB as primary | Weaker relational fit for RBAC/catalog |
| Server-side GPU try-on (v1) | Cost/complexity; browser path preferred |

---

## Decision Log Rule

Any stack change requires an ADR in `docs/adr/` and approval before implementation.
