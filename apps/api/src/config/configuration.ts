export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '4000', 10),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  storage: {
    provider: process.env.STORAGE_PROVIDER ?? 'minio',
    bucket: process.env.STORAGE_BUCKET ?? 'vj-assets',
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION ?? 'us-east-1',
    accessKey: process.env.STORAGE_ACCESS_KEY,
    secretKey: process.env.STORAGE_SECRET_KEY,
    publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL,
    forcePathStyle: (process.env.STORAGE_FORCE_PATH_STYLE ?? 'true') === 'true',
    presignUploadTtlSec: parseInt(process.env.PRESIGN_UPLOAD_TTL_SEC ?? '600', 10),
    presignDownloadTtlSec: parseInt(process.env.PRESIGN_DOWNLOAD_TTL_SEC ?? '120', 10),
  },
  capturesDefaultTtlDays: parseInt(process.env.CAPTURES_DEFAULT_TTL_DAYS ?? '30', 10),
});
