FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/types/package.json packages/types/
COPY packages/tsconfig packages/tsconfig
RUN pnpm install --filter @vj/api... --frozen-lockfile=false

FROM deps AS build
COPY apps/api apps/api
COPY packages/shared packages/shared
COPY packages/types packages/types
RUN pnpm --filter @vj/shared build && pnpm --filter @vj/api prisma:generate && pnpm --filter @vj/api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
