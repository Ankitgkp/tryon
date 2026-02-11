FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY services/ai-generation/ ./services/ai-generation/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @tryon/shared-types build
RUN pnpm --filter @tryon/ai-generation build

FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY --from=base /app ./
RUN pnpm install --frozen-lockfile --prod

EXPOSE 3005

CMD ["node", "services/ai-generation/dist/index.js"]
