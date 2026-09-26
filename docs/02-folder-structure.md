# 02 - Project Folder Structure (Monorepo)

## Goals

- Two engineers work in parallel with minimal merge conflicts
- Clear ownership boundaries (api vs web/ar-engine vs shared contracts)
- Feature-based modules inside each app
- Single install, shared lint/tsconfig, reproducible Docker builds

**Recommended tooling:** pnpm workspaces + Turborepo (or Nx). Lockfile at root.

---

## Tree

```
virtual-jewellery-tryon/
├── apps/
│   ├── web/                      # Customer Next.js 15 app
│   ├── admin/                    # Admin Next.js 15 app
│   └── api/                      # NestJS API
├── packages/
│   ├── ui/                       # shadcn-based design system
│   ├── hooks/                    # Shared React hooks (non-AR)
│   ├── ar-engine/                # TF.js + Three/R3F try-on engine
│   ├── shared/                   # Pure TS utils, constants, zod schemas
│   ├── types/                    # Shared DTO/entity TypeScript types
│   ├── api-client/               # Typed fetch client (OpenAPI-driven)
│   ├── config/                   # eslint, prettier, tsconfig, tailwind presets
│   └── tsconfig/                 # Base TS configs
├── docs/                         # Architecture foundation (this folder)
├── docker/                       # Dockerfiles, nginx, compose overlays
├── scripts/                      # Dev/ops scripts
├── .github/workflows/            # CI/CD
├── pnpm-workspace.yaml
├── turbo.json                    # or nx.json
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── LICENSE
```

---

## apps/web - Customer Experience

```
apps/web/
├── src/
│   ├── app/                      # App Router
│   │   ├── (marketing)/          # Landing, about
│   │   ├── (shop)/               # Catalog, product detail
│   │   ├── try-on/[productId]/  # Camera try-on experience
│   │   ├── account/              # Profile, captures gallery
│   │   ├── api/                  # BFF routes only if needed (prefer Nest)
│   │   ├── layout.tsx
│   │   └── error.tsx / loading.tsx
│   ├── features/
│   │   ├── catalog/
│   │   ├── try-on/
│   │   ├── capture/
│   │   └── auth/
│   ├── components/               # App-specific composition
│   ├── stores/                   # Zustand (session UI state)
│   ├── lib/                      # Query client, auth helpers
│   └── styles/
├── public/
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

**Ownership:** Engineer B. Imports `@vj/ui`, `@vj/hooks`, `@vj/ar-engine`, `@vj/api-client`, `@vj/types`.

---

## apps/admin - Operations Console

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── assets/
│   │   │   ├── users/
│   │   │   ├── settings/
│   │   │   ├── analytics/
│   │   │   └── audit-logs/
│   │   └── layout.tsx
│   ├── features/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── assets/
│   │   ├── users/
│   │   └── settings/
│   ├── components/
│   ├── stores/
│   └── lib/
└── package.json
```

**Ownership:** Engineer A for data flows; Engineer B for UI polish. Prefer thin pages + feature modules.

---

## apps/api - NestJS Backend

```
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/                   # filters, interceptors, pipes, decorators
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── categories/
│   │   ├── products/
│   │   ├── jewellery-assets/
│   │   ├── uploads/
│   │   ├── try-on/
│   │   ├── captures/
│   │   ├── settings/
│   │   ├── analytics/
│   │   ├── audit/
│   │   └── health/
│   ├── infrastructure/
│   │   ├── prisma/
│   │   ├── redis/
│   │   └── storage/              # MinIO / R2 adapters
│   └── workers/                  # Optional queue consumers
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/
├── Dockerfile
└── package.json
```

Each module:

```
modules/products/
├── products.module.ts
├── products.controller.ts
├── products.service.ts
├── products.repository.ts
├── dto/
├── entities/                     # domain types if needed
└── products.constants.ts
```

**Ownership:** Engineer A exclusive for schema/migrations; contracts updated via PR into `packages/types`.

---

## packages/* - Shared Libraries

### packages/ui

shadcn/ui primitives + brand tokens + composed components (`ProductCard`, `DataTable`, `EmptyState`). No business API calls.

### packages/hooks

`useDebounce`, `useMediaQuery`, `useLocalStorage`, auth session helpers that do not import AR.

### packages/ar-engine

```
packages/ar-engine/
├── src/
│   ├── camera/
│   ├── models/                   # TF.js model loaders + configs
│   ├── detectors/                # face, hand
│   ├── landmarks/
│   ├── anchors/                  # JewelleryKind -> AnchorProfile
│   ├── fitting/                  # scale, rotation, tracking
│   ├── renderers/                # canvas2d, three/r3f bridges
│   ├── capture/
│   ├── performance/
│   └── index.ts
├── package.json
└── README.md
```

**Hard rule:** Only `apps/web` (and optional admin preview) depend on this package. Keeps CV changes off the API merge path.

### packages/shared

Constants (`JewelleryKind`, error codes), pure helpers, shared zod schemas for forms that mirror API DTOs.

### packages/types

TypeScript interfaces matching API contracts. Prefer generating from OpenAPI when Swagger stabilizes; until then hand-maintained with review.

### packages/api-client

Thin typed client: `auth`, `products`, `tryOn`, etc. Used by web + admin. One place for base URL, refresh interceptors.

### packages/config + packages/tsconfig

ESLint flat config, Prettier, Tailwind preset, base `tsconfig` for strict mode.

---

## docs/

Architecture ADRs and foundation docs (01-09). Implementation PRs must not contradict these without an ADR update.

---

## docker/

```
docker/
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
├── api.Dockerfile
├── web.Dockerfile
├── admin.Dockerfile
├── docker-compose.yml            # local/dev
├── docker-compose.staging.yml
└── docker-compose.prod.yml
```

---

## scripts/

```
scripts/
├── setup-dev.sh | setup-dev.ps1
├── seed-demo-data.ts
├── backup-db.sh
├── restore-db.sh
├── generate-api-client.ts
└── smoke-test.sh
```

---

## Why This Structure Minimizes Conflicts

| Area | Owner | Conflict risk |
|------|-------|---------------|
| `apps/api/**` | A | Low if B never edits |
| `apps/web/**` + `packages/ar-engine` | B | Low if A never edits |
| `apps/admin/**` | Shared by feature folder | Medium - split by feature path |
| `packages/types`, OpenAPI | Both via small contract PRs | Controlled |
| `prisma/schema.prisma` | A only | Critical - serialize schema PRs |

---

## Git Branch Strategy (aligned with structure)

```
main          # production tags only via release PRs
develop       # integration
feature/*     # e.g. feature/api-products, feature/web-tryon-earrings
release/*     # release/1.0.0
hotfix/*      # hotfix/capture-download-cors
```

Never push directly to `main`. Every feature through Pull Request with required checks.
