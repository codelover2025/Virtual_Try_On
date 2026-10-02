# 09 - Deployment Architecture

**Host baseline:** Ubuntu LTS  
**Orchestration (v1):** Docker + Docker Compose  
**Edge:** Nginx  
**CI/CD:** GitHub Actions  
**Git:** main <- PR only; develop <- feature/release/hotfix

---

## 1. Environments

| Env | Purpose | Data | URL pattern |
|-----|---------|------|-------------|
| **development** | Engineer laptops | Seed/demo | localhost |
| **staging** | QA / UAT parity | Anonymized/synth | staging.example.com |
| **production** | Live SaaS | Real | app.example.com / admin.example.com / api.example.com |

Parity rule: same images and compose services; differ by env files, replicas, resource limits, backup schedules.

---

## 2. Development

```text
pnpm install
docker compose -f docker/docker-compose.yml up -d postgres redis minio
pnpm --filter api prisma migrate dev
pnpm --filter api prisma db seed
pnpm dev   # turbo: web, admin, api
```

Optional: run api also in Docker for closer parity.

Local object storage: MinIO console for bucket inspection.

---

## 3. Staging & Production Topology

```
                    ┌─────────────────────────┐
                    │   GitHub Actions CI/CD  │
                    └───────────┬─────────────┘
                                │ deploy SSH / agent
                                ▼
┌───────────────────────────────────────────────────────────┐
│ Ubuntu Host                                               │
│  Nginx (:80/:443)                                         │
│    /           -> web:3000                                 │
│    /admin      -> admin:3001                               │
│    /api        -> api:4000                                 │
│    /storage    -> optional MinIO gateway or CDN to R2      │
│                                                           │
│  Docker Compose                                           │
│    api | web | admin | postgres | redis | minio(optional) │
│    (prod may use managed Postgres + R2 instead of local)  │
└───────────────────────────────────────────────────────────┘
```

**Recommended prod split:**

- PostgreSQL: managed or compose with volume + backups
- Redis: compose or managed
- Objects: Cloudflare R2
- App containers: web, admin, api, nginx

---

## 4. Docker

### Images

| Image | Build context | Notes |
|-------|---------------|-------|
| `api` | monorepo, target api | multi-stage: deps -> build -> prune -> runner |
| `web` | monorepo, target web | `output: standalone` |
| `admin` | monorepo, target admin | `output: standalone` |
| `nginx` | config mount | official nginx + conf |

### Compose services (logical)

- `postgres` - volume `pgdata`, healthcheck
- `redis` - volume optional AOF
- `minio` - dev/staging; prod often external R2
- `api` - depends_on healthy postgres/redis
- `web`, `admin`
- `nginx` - publishes 80/443
- `migrate` - one-shot job on deploy

Restart policy: `unless-stopped`. Resource limits on api/web in prod.

---

## 5. Nginx Responsibilities

- TLS termination (Let’s Encrypt / certbot or external LB)
- HTTP -> HTTPS redirect
- Reverse proxy paths to containers
- `client_max_body_size` aligned with upload limits (presign preferred -> smaller API bodies)
- Gzip/brotli for text
- Security headers (CSP carefully for camera/WebGL/WASM)
- Basic rate limiting zones for `/api/v1/auth`
- Cache static Next assets aggressively; never cache personalized API

**CSP notes:** allow `wasm-unsafe-eval` / blob workers as required by TF.js; camera not a CSP issue but HTTPS is mandatory for getUserMedia.

---

## 6. CI/CD (GitHub Actions)

### On Pull Request

1. Checkout + pnpm install (cache)
2. Lint + typecheck (turbo)
3. Unit tests
4. Build api/web/admin
5. Optional: OpenAPI drift check
6. Block merge on failure

### On merge to `develop`

1. Build & push images tagged `develop-<sha>`
2. Deploy to staging
3. Run migrate job
4. Smoke: `/health/ready`, homepage, admin login

### On `release/*` -> PR to `main`

1. Version bump / changelog
2. Deploy production after approval environment
3. Tag `vX.Y.Z`
4. Migrate -> roll containers -> smoke

### Hotfix

`hotfix/*` from `main` -> PR to `main` + back-merge `develop`.

**Never push directly to `main`.**

---

## 7. Secrets Management

| Secret | Where |
|--------|-------|
| `DATABASE_URL` | Host env / Compose env file (not in git) |
| `REDIS_URL` | same |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | same; rotate procedure documented |
| `STORAGE_*` keys | same |
| `MINIO_ROOT_PASSWORD` | dev only |
| GHCR / registry creds | GitHub Secrets |
| SSH deploy key | GitHub Environments |

Rules:
- `.env.example` committed with empty placeholders
- `.env*` gitignored except example
- No secrets in Docker images
- Staging secrets ≠ production secrets

---

## 8. Environment Variables (canonical groups)

### API

```text
NODE_ENV
PORT=4000
DATABASE_URL
REDIS_URL
JWT_ACCESS_SECRET
JWT_ACCESS_TTL
JWT_REFRESH_SECRET
JWT_REFRESH_TTL
CORS_ORIGINS
STORAGE_PROVIDER=minio|r2
STORAGE_BUCKET
STORAGE_ENDPOINT
STORAGE_REGION
STORAGE_ACCESS_KEY
STORAGE_SECRET_KEY
STORAGE_PUBLIC_BASE_URL
PRESIGN_UPLOAD_TTL_SEC
PRESIGN_DOWNLOAD_TTL_SEC
CAPTUTES_DEFAULT_TTL_DAYS
LOG_LEVEL
```

### Web / Admin

```text
NODE_ENV
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_APP_URL
# no private secrets in NEXT_PUBLIC_*
```

### Nginx / Host

```text
DOMAIN_WEB
DOMAIN_ADMIN
DOMAIN_API
TLS cert paths
```

---

## 9. Database Backup

| Env | Strategy |
|-----|----------|
| Dev | Optional; recreate from seed |
| Staging | Nightly `pg_dump` to object storage |
| Production | Nightly full dump + WAL archiving if managed; weekly restore drill |

Scripts: `scripts/backup-db.sh`, `scripts/restore-db.sh`  
Retention: 7 daily / 4 weekly / 3 monthly (adjust to policy)  
Before migrate on prod: automatic backup snapshot step in CD.

---

## 10. Object Storage Ops

- Versioning enabled on product/asset buckets
- Separate bucket prefixes: `products/`, `assets/`, `captures/`
- Lifecycle rule: expire captures per `expiresAt` / TTL days
- CORS on bucket for browser PUT to presigned URLs

---

## 11. Monitoring

| Signal | Tooling (OSS-friendly) |
|--------|------------------------|
| Container health | Docker healthchecks + restart |
| API metrics | `/metrics` scraped by Prometheus (optional compose) |
| Uptime | Uptime Kuma / external ping on `/health/ready` |
| Host | node_exporter or simple netdata |
| Alerts | Email/Slack webhook on health fail |

App metrics to expose: request rate, 5xx, auth failures, try-on session starts, capture saves, presign errors.

---

## 12. Logging

- JSON logs to stdout -> Docker logging driver
- Correlate with `requestId`
- Centralization (phase 2): Loki / ELK; v1 may use `docker compose logs` + log rotate
- PII redaction: no passwords; truncate tokens; avoid logging emails in high-volume paths if policy requires

---

## 13. Scaling Path (post-v1)

1. Move Postgres/Redis/R2 to managed services  
2. Multiple api replicas behind Nginx/upstream  
3. CDN in front of Next static + public images  
4. Optional Kubernetes when single-host limits hit  
Architecture of apps remains unchanged (stateless API + client AR).

---

## 14. Security Hardening Checklist

- [ ] Firewall: only 80/443 public
- [ ] SSH key-only, fail2ban optional
- [ ] Unattended security updates
- [ ] Non-root containers
- [ ] Read-only root FS where practical
- [ ] Regular dependency scanning in CI
- [ ] TLS 1.2+
- [ ] Admin on separate subdomain

---

## 15. Rollback

1. CD keeps previous image digest
2. Redeploy previous tag
3. DB migrations must be backward-compatible (expand/contract); avoid destructive deploys without restore plan

---

## 16. Definition of Production-Ready (Ops)

- Health green for api+db+redis+storage
- Automated migrate + backup before migrate
- PR CI green required
- Staging smoke passed
- Secrets not in repo
- Capture download HTTPS only
- Camera try-on verified on staging HTTPS domain
