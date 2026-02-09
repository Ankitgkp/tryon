FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy workspace root config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy shared packages
COPY packages/ ./packages/

# Copy this service
COPY services/image-service/ ./services/image-service/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first, then this service
RUN pnpm --filter @tryon/shared-types build
RUN pnpm --filter @tryon/image-service build

# --- Production stage ---
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY --from=base /app ./

# Only install production dependencies in the final image
RUN pnpm install --frozen-lockfile --prod

EXPOSE 3002

CMD ["node", "services/image-service/dist/index.js"]
