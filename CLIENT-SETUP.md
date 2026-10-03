# Virtual Jewellery Try-On — Client Setup & Run Guide

> Complete step-by-step guide to set up and run the project on a fresh Windows machine.

---

## 1. Prerequisites

Install **all** of the following before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 22 LTS | https://nodejs.org/ |
| pnpm | 9.15.0 | (see below) |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop/ |
| Git | Latest | https://git-scm.com/ |

### 1a. Install pnpm (after Node.js is installed)

Open **PowerShell** and run:

```powershell
npm install -g pnpm@9.15.0
```

### 1b. Verify all tools are installed

```powershell
node -v       # Should print v22.x.x
pnpm -v       # Should print 9.15.0
docker -v     # Should print Docker version ...
git --version # Should print git version ...
```

### 1c. Start Docker Desktop

Open **Docker Desktop** and wait until the status bar shows **"Engine running"** before proceeding.

---

## 2. Get the project

```powershell
git clone <YOUR_REPO_URL>
cd "Sudesh Fiverr"
```

> If the project folder is already on disk, just open a PowerShell terminal inside the root folder (`Sudesh Fiverr`).

---

## 3. Install dependencies

From the **project root** folder:

```powershell
pnpm install
```

> **Warning — pnpm hoisting (required on Windows):**
>
> This monorepo requires Tailwind, NestJS, Prisma, and other packages to be
> hoisted to root node_modules so Next.js and NestJS can resolve them.
> The .npmrc file in the project root already contains the correct hoisting rules.
>
> If after pnpm install you still see errors like:
> - Cannot find module tailwindcss
> - Cannot find module @nestjs/common
> - Cannot find module @tensorflow/tfjs
>
> Run these commands to force-hoist all affected packages:
>
> ```powershell
> pnpm add --filter @vj/web --shamefully-hoist tailwindcss postcss autoprefixer class-variance-authority clsx tailwind-merge
> pnpm add --filter @vj/api --shamefully-hoist @nestjs/common @nestjs/config @nestjs/core @nestjs/jwt @nestjs/passport @nestjs/platform-express @nestjs/swagger @nestjs/terminus @prisma/client class-validator class-transformer reflect-metadata rxjs ioredis
> pnpm add --filter @vj/ar-engine --shamefully-hoist @tensorflow/tfjs @tensorflow-models/blazeface @tensorflow-models/hand-pose-detection three
> ```

---

## 4. Set up environment files

### 4a. Root .env

```powershell
Copy-Item .env.example .env
```

### 4b. API .env

```powershell
Copy-Item apps\api\.env.example apps\api\.env
```

> The default values in .env.example work for local Docker Postgres/Redis out of the box.
> For production, change JWT_ACCESS_SECRET and JWT_REFRESH_SECRET to long random strings (32+ chars).

---

## 5. Start infrastructure (Postgres + Redis)

From the project root:

```powershell
docker compose -f docker/docker-compose.yml up -d postgres redis
```

### Verify containers are healthy

```powershell
docker compose -f docker/docker-compose.yml ps
```

You should see both postgres and redis with status healthy / running.

> **MinIO (object storage) is NOT required for Phase 1.** The API defaults to
> STORAGE_PROVIDER=local — files are saved under apps/api/storage-data.
> If you see a MinIO pull error, safely ignore it and continue.

---

## 6. Build shared packages

```powershell
pnpm --filter @vj/shared build
pnpm --filter @vj/types build
pnpm --filter @vj/ar-engine build
```

---

## 7. Set up the database

Run all three commands in order:

### 7a. Generate Prisma client

```powershell
pnpm --filter @vj/api prisma:generate
```

### 7b. Apply database migrations

```powershell
pnpm --filter @vj/api exec prisma migrate deploy
```

### 7c. Seed the database

```powershell
pnpm --filter @vj/api prisma:seed
```

The seed creates:

| Item | Value |
|------|-------|
| Admin email | admin@vj.local |
| Admin password | Admin@12345 |
| Demo products | 3 earring products with try-on assets |

---

## 8. Run the applications

**Option A (Recommended) — run everything with one command:**

```powershell
pnpm dev
```

This uses Turborepo to start all apps simultaneously. Watch the terminal for Ready messages.

**Option B — run each app in a separate terminal:**

### Terminal 1 — API (NestJS backend)

```powershell
pnpm --filter @vj/api dev
```

Wait for: API listening on http://localhost:4000/api/v1

### Terminal 2 — Web (customer try-on app)

```powershell
pnpm --filter @vj/web dev
```

Wait for: Ready in Xs

### Terminal 3 — Admin (optional)

```powershell
pnpm --filter @vj/admin dev
```

Wait for: Ready in Xs

> **Do NOT run both pnpm dev (Turbo) and individual pnpm --filter commands at the same time.**
> Turbo already starts all apps. Running them individually when Turbo is active causes
> EADDRINUSE port conflicts.

---

## 9. Access the application

| Service | URL |
|---------|-----|
| Web — Home | http://localhost:3000 |
| Web — Try-On Studio | http://localhost:3000/try-on |
| Web — Products | http://localhost:3000/products |
| Admin | http://localhost:3001 |
| API base | http://localhost:4000/api/v1 |
| Swagger docs | http://localhost:4000/api/docs |
| Health check | http://localhost:4000/api/v1/health/ready |

---

## 10. Using the Try-On Studio

1. Open http://localhost:3000/try-on
2. Click "Start camera try-on"
3. Allow camera access when the browser prompts
4. Center your face in the frame
5. Select a jewellery piece from the panel to see it overlaid on your face
6. Use the Capture button to save a screenshot

> **Camera not working?**
> Click the lock icon in the browser address bar -> Site settings ->
> set Camera to Allow, then reload the page.

---

## 11. Quick verification (smoke test)

### PowerShell smoke test

```powershell
powershell -ExecutionPolicy Bypass -File scripts/phase1-smoke.ps1
```

### Manual checks

1. http://localhost:4000/api/v1/health/ready -> should return {"status":"ok"}
2. http://localhost:4000/api/docs -> Swagger UI loads
3. http://localhost:3000/try-on -> shows jewellery products, camera preview works

### Test login via API

```powershell
curl -X POST http://localhost:4000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@vj.local","password":"Admin@12345"}'
```

---

## 12. One-page command summary

Run these in order after Docker Desktop is running and you are in the project root:

```powershell
# 1. Install
pnpm install

# 2. Environment files
Copy-Item .env.example .env
Copy-Item apps\api\.env.example apps\api\.env

# 3. Start Postgres + Redis
docker compose -f docker/docker-compose.yml up -d postgres redis

# 4. Build shared packages
pnpm --filter @vj/shared build
pnpm --filter @vj/types build
pnpm --filter @vj/ar-engine build

# 5. Database setup
pnpm --filter @vj/api prisma:generate
pnpm --filter @vj/api exec prisma migrate deploy
pnpm --filter @vj/api prisma:seed

# 6. Start everything
pnpm dev
```

---

## 13. Stop services

Stop Node apps with Ctrl + C in the terminal running pnpm dev.

Stop Docker containers:

```powershell
docker compose -f docker/docker-compose.yml stop
```

Remove containers (keeps DB data):

```powershell
docker compose -f docker/docker-compose.yml down
```

Remove containers AND all data (full reset):

```powershell
docker compose -f docker/docker-compose.yml down -v
```

---

## 14. Troubleshooting

### Port conflicts (EADDRINUSE)

If you see "address already in use :::3000" (or 3001/4000), run this to kill all occupying processes:

```powershell
@(3000, 3001, 4000) | ForEach-Object {
  $port = $_
  $pids = (netstat -ano | findstr ":$port ") -split '\s+' |
    Where-Object { $_ -match '^\d+$' } |
    Select-Object -Last 1 |
    Sort-Object -Unique
  $pids | ForEach-Object {
    taskkill /PID $_ /F
    Write-Host "Killed PID $_ on port $port"
  }
}
```

Then re-run pnpm dev.

### Common errors table

| Problem | Fix |
|---------|-----|
| Cannot reach database server at localhost:5432 | Start Docker Desktop, then: docker compose -f docker/docker-compose.yml up -d postgres redis |
| Redis ECONNREFUSED | Same as above — ensure Redis container shows healthy |
| Cannot find module dist/main | Run: pnpm --filter @vj/api build then pnpm --filter @vj/api dev |
| EADDRINUSE: address already in use | See Port conflicts above. Never mix pnpm dev (Turbo) with individual --filter commands |
| Cannot find module tailwindcss or @nestjs/common | pnpm hoisting issue — run the hoist commands in Step 3 |
| Cannot find module @tensorflow/tfjs or three | pnpm add --filter @vj/ar-engine --shamefully-hoist @tensorflow/tfjs @tensorflow-models/blazeface @tensorflow-models/hand-pose-detection three |
| Cannot find module class-variance-authority | pnpm add --filter @vj/ui --shamefully-hoist class-variance-authority clsx tailwind-merge |
| @next/swc-win32-x64-msvc blocked warning | Windows Application Control policy blocks the native binary. Next.js falls back to WASM automatically — app still works, first compile is slower. No action needed |
| Hydration mismatch warning in browser | Caused by browser extensions (e.g. Grammarly). Already suppressed in layout.tsx. Safe to ignore |
| No pieces available for try-on | Database not seeded. Run: pnpm --filter @vj/api prisma:seed |
| Camera permission denied | Click lock icon in browser address bar -> Site settings -> Camera -> Allow |
| localhost refused / ERR_CONNECTION_REFUSED | Try http://127.0.0.1:3000 instead. Disconnect any active VPN |
| MinIO pull failed | Safe to ignore for Phase 1 — only needed for cloud file uploads |
| pnpm not found | npm install -g pnpm@9.15.0 |

---

## 15. Project structure

```
apps/
  api/          NestJS backend (Auth, Products, Categories, Uploads, Try-On)
  web/          Next.js customer app + /try-on AR demo
  admin/        Next.js admin shell (Phase 1 minimal UI)

packages/
  ar-engine/    Camera, face detection, Three.js jewellery overlay engine
  shared/       Shared enums and constants
  types/        Shared TypeScript types
  ui/           Shared React component library (shadcn/ui based)
  api-client/   Typed API client (used by web + admin)
  hooks/        Shared React hooks

docker/         Docker Compose + API Dockerfile
docs/           Architecture documents
scripts/        Utility and smoke-test scripts
```

---

## 16. Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@vj.local | Admin@12345 |

---
