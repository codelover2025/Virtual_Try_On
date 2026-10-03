import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production', 'test').default('development'),
  API_PORT: Joi.number().default(4000),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  STORAGE_PROVIDER: Joi.string().valid('local', 'minio', 'r2').default('local'),
  STORAGE_BUCKET: Joi.string().default('vj-assets'),
  STORAGE_ENDPOINT: Joi.string().default('http://localhost:4000'),
  STORAGE_REGION: Joi.string().default('us-east-1'),
  STORAGE_ACCESS_KEY: Joi.string().default('local'),
  STORAGE_SECRET_KEY: Joi.string().default('local'),
  STORAGE_PUBLIC_BASE_URL: Joi.string().default('http://localhost:4000/api/v1/uploads/files'),
});
