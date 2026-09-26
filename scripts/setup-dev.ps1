Write-Host "Starting Postgres, Redis, MinIO..."
docker compose -f docker/docker-compose.yml up -d postgres redis minio createbuckets
Write-Host "Copy .env.example to .env if missing"
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
Write-Host "Install deps: pnpm install"
Write-Host "Then: pnpm db:generate && pnpm --filter @vj/api prisma migrate dev --name init && pnpm db:seed"
Write-Host "API: pnpm --filter @vj/api dev"
