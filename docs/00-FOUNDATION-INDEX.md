# Virtual Jewellery Try-On Platform - Architecture Foundation

**Status:** Design-only (no implementation code)  
**Audience:** Two parallel engineers + stakeholders  
**Product type:** Production SaaS - Virtual Jewellery Try-On Web Platform  
**Constraint stack:** Next.js 15 | NestJS | PostgreSQL | Redis | TensorFlow.js | Three.js | Docker (no MediaPipe, no paid AR SDKs)

---

## Document Map

| # | Document | Purpose |
|---|----------|---------|
| 01 | [Software Architecture](./01-software-architecture.md) | System design, layers, flows, deployment topology |
| 02 | [Project Folder Structure](./02-folder-structure.md) | Scalable monorepo for parallel development |
| 03 | [Technology Decisions](./03-technology-decisions.md) | ADR-style rationale for every major choice |
| 04 | [Database Design](./04-database-design.md) | Production schema, indexes, soft delete, RBAC |
| 05 | [API Design](./05-api-design.md) | REST contracts for auth, catalog, try-on, uploads |
| 06 | [Frontend Architecture](./06-frontend-architecture.md) | Apps, routing, state, components, UX strategies |
| 07 | [Backend Architecture](./07-backend-architecture.md) | NestJS modules, DI, caching, exceptions |
| 08 | [Computer Vision Architecture](./08-computer-vision-architecture.md) | TF.js pipeline, alignment, tracking, perf |
| 09 | [Deployment Architecture](./09-deployment-architecture.md) | Dev/staging/prod, CI/CD, secrets, ops |

---

## Parallel Engineering Split (Conflict Minimization)

| Engineer A (Platform / Backend) | Engineer B (Experience / Frontend + CV) |
|---------------------------------|-----------------------------------------|
| `apps/api`, Prisma, Redis, Auth | `apps/web`, Try-On UI, TF.js / R3F |
| `apps/admin` APIs + admin UI shells | Shared UI consumption from `packages/ui` |
| Uploads, MinIO/R2, settings, audit | Landing, catalog UX, capture/download |
| Docker, Nginx, CI/CD, monitoring | `packages/ar-engine`, landmarks, overlays |

**Shared contracts live only in:** `packages/types`, `packages/shared`, OpenAPI from NestJS Swagger.

---

## Non-Negotiables

- No MediaPipe, no paid AR/CV SDKs, no commercial try-on libraries
- Modular, feature-based structure; SOLID / DRY / KISS
- UUID primary keys, soft delete, audit logging
- Git: `main` <- PR only; `develop` <- `feature/*` | `release/*` | `hotfix/*`
- Design documents are source of truth until implementation PRs land

| 10 | [Phase 1 Checklist](./10-phase1-checklist.md) | Completion evidence for foundation gate |
