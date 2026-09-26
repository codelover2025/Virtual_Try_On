# Phase 1 Completion Checklist

## Status: COMPLETE

| Criterion | Evidence |
|-----------|----------|
| APIs complete | NestJS modules: auth, users, roles, categories, products, assets, uploads, try-on, captures, settings, analytics, audit, health. Swagger at `/api/docs`. |
| Database finalized | Prisma schema + `20250926000000_init` migration applied; UUID, soft delete, indexes, RBAC seed. |
| Authentication works | JWT login/refresh/me + RBAC permissions. Smoke: `scripts/phase1-smoke.ps1` (admin@vj.local). |
| Camera opens | `CameraEngine` via `getUserMedia` in `/try-on` Start button. |
| Face detection running | BlazeFace (`@tensorflow-models/blazeface`, pure TF.js — no `@mediapipe/*`). Landmark dots on canvas. |
| Three.js renders | `ThreeRenderer` with WebGL canvas overlay on try-on stage. |
| Basic jewellery overlay visible | Procedural gold drop earrings (`procedural://earring`) anchored to left/right ear tragions. |

## How to run Phase 1 demo

```bash
# Infra + API (if not already running)
docker compose -f docker/docker-compose.yml up -d postgres redis
pnpm --filter @vj/api dev

# Web try-on
pnpm --filter @vj/web dev
# Open http://localhost:3000/try-on
```

## Notes

- MinIO image pull may be blocked on some networks; uploads optional for Phase 1 overlay demo.
- Windows Application Control may force Next.js SWC WASM fallback (slower first compile).
