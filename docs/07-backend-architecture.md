# 07 - Backend Architecture

**Runtime:** NestJS (Node.js) in `apps/api`  
**Patterns:** SOLID, DI, Repository, feature modules, DTO validation, Swagger

---

## 1. Module Map

```
AppModule
├── ConfigModule (global)
├── PrismaModule (global)
├── RedisModule (global)
├── StorageModule (global)
├── AuthModule
├── UsersModule
├── RolesModule
├── CategoriesModule
├── ProductsModule
├── JewelleryAssetsModule
├── UploadsModule
├── TryOnModule
├── CapturesModule
├── SettingsModule
├── AnalyticsModule
├── AuditModule
└── HealthModule
```

Each feature module exports only what others need (e.g. `ProductsService` for TryOn).

---

## 2. Layering Inside a Module

```
Controller  ->  Service  ->  Repository  ->  PrismaClient
                ↓
         StoragePort / RedisPort / other modules' services
```

| Layer | Responsibility | Must not |
|-------|----------------|----------|
| Controller | HTTP mapping, Swagger decorators | Business rules, Prisma |
| Service | Use-cases, transactions, cache policy | Know Express req/res |
| Repository | Queries, soft-delete filters | HTTP concerns |
| DTO | Input validation shapes | Behavior |

---

## 3. Controllers

- Thin: parse params -> call service -> return envelope
- Versioned under `/api/v1`
- Group admin routes under `/admin/*` controllers or path prefixes
- Use `@ApiTags`, `@ApiBearerAuth`, response DTO types

Example split:

- `ProductsPublicController` - GET list/detail  
- `ProductsAdminController` - POST/PATCH/DELETE/publish  

---

## 4. Services

One service per aggregate use-case cluster:

- `ProductsService.create / update / publish / softDelete`
- `TryOnSessionsService.start / complete`
- `CapturesService.register / signDownload / softDelete`
- `UploadsService.presign / complete`

Transactions: `prisma.$transaction` for product + primary image consistency.

Emit audit via `AuditService.record(...)` from mutating admin services.

---

## 5. Repositories

Interface + Prisma implementation (DI token):

```text
IProductRepository
  findPublishedPage(filter)
  findBySlug(slug)
  create(data)
  update(id, data)
  softDelete(id)
```

Benefits: testability, prevents Prisma leakage, allows raw SQL for analytics later.

Global soft-delete: Prisma client extension filters `deletedAt: null` unless `withDeleted: true`.

---

## 6. DTOs & Validation

- `class-validator` + `class-transformer`
- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`
- Separate `CreateXDto`, `UpdateXDto`, `QueryXDto`, `ResponseXDto`
- Mirror critical enums with `packages/shared` zod for frontend forms (generate or hand-sync)

---

## 7. Guards

| Guard | Purpose |
|-------|---------|
| `JwtAuthGuard` | Require valid access token |
| `OptionalJwtAuthGuard` | Attach user if present (guest try-on) |
| `RolesGuard` | Role codes from `@Roles()` |
| `PermissionsGuard` | Permission codes from `@Permissions()` |

Decorator stack example: `@Permissions('products:publish')`.

---

## 8. Middleware

- `RequestIdMiddleware` - ensure `x-request-id`
- `LoggerMiddleware` - method, path, status, duration
- Helmet via Nest middleware/adapter
- CORS from config allowlist

Rate limiting: Redis-backed guard/middleware on `/auth/*` and `/uploads/*`.

---

## 9. Caching Strategy

| Key pattern | TTL | Invalidate on |
|-------------|-----|---------------|
| `product:slug:{slug}` | 60-300s | product update/publish/delete |
| `products:list:{hash}` | 30-60s | any product mutation |
| `categories:tree` | 300s | category mutation |
| `settings:public` | 60s | settings update |

Service reads: try Redis -> DB -> set cache.  
Never cache personalized captures lists without userId in key.

---

## 10. Exception Handling

- Domain exceptions: `NotFoundException`, `ConflictException`, custom `AppException(code, message, status)`
- `AllExceptionsFilter` maps to error envelope + logs stack for 5xx
- Do not leak Prisma internals to clients

---

## 11. Interceptors

- `ResponseEnvelopeInterceptor` - wrap success payloads
- `TimeoutInterceptor` - protect slow handlers
- Optional `CacheInterceptor` for pure GETs

---

## 12. Auth Internals

1. Login validates password (argon2/bcrypt)
2. Issue access JWT (short) + refresh (long, hashed in DB)
3. Refresh rotates token; old revoked
4. Logout revokes refresh; optional access JTI blacklist until exp
5. Permissions loaded from DB (or embedded claims for SUPER_ADMIN) and checked in guard

---

## 13. Storage Abstraction

```text
StoragePort
  createPresignedUpload(key, mime, bytes, ttl)
  createPresignedDownload(key, ttl, fileName?)
  headObject(key)
  deleteObject(key)
```

Adapters: `MinioStorageAdapter`, `R2StorageAdapter`. Selected by `STORAGE_PROVIDER` env.

---

## 14. Cross-Cutting Concerns

| Concern | Approach |
|---------|----------|
| Config | `@nestjs/config` + Joi/Zod schema validation at boot |
| Logging | structured JSON (pino/winston) |
| Metrics | `/metrics` counters: requests, tryon starts, capture saves |
| Health | Terminus: Prisma, Redis, storage |
| Jobs (phase 2) | BullMQ: capture thumbnails, expire captures, analytics rollup |

---

## 15. Testing Strategy

- Unit: services with mocked repositories
- Integration: testcontainers or compose Postgres/Redis
- e2e: critical auth + product + try-on session + capture register
- Contract: OpenAPI diff in CI

---

## 16. Coding Standards Enforcement

- Strict TypeScript (`strict: true`)
- ESLint + Prettier from `packages/config`
- No cross-module deep imports (only public module exports)
- No duplicated mapping logic - use dedicated mappers/serializers
