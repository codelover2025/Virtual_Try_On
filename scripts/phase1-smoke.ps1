$ErrorActionPreference = "Stop"
$base = "http://localhost:4000/api/v1"

Write-Host "== health =="
Invoke-RestMethod "$base/health/ready" | ConvertTo-Json -Compress

Write-Host "== login =="
$login = Invoke-RestMethod -Method POST -Uri "$base/auth/login" -ContentType "application/json" -Body (@{
  email = "admin@vj.local"
  password = "Admin@12345"
} | ConvertTo-Json)
$token = $login.data.tokens.accessToken
Write-Host "token acquired"

Write-Host "== me =="
Invoke-RestMethod -Uri "$base/auth/me" -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Compress

Write-Host "== categories =="
Invoke-RestMethod "$base/categories" | ConvertTo-Json -Compress

Write-Host "Phase 1 API smoke OK"
