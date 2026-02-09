# API Gateway Service

## Overview

The API Gateway is the **single entry point** for all client-facing requests to the try-on platform. No client should ever talk to internal services directly.

## Responsibilities

| Concern              | Status        | Notes                                           |
| -------------------- | ------------- | ----------------------------------------------- |
| Request routing      | ✅ Stubbed    | Routes registered, forwarding deferred          |
| API key auth         | ✅ Mock       | Accepts keys with `tryon_` prefix               |
| Request logging      | ✅ Implemented| Structured JSON via pino, request ID tracing    |
| Error handling       | ✅ Implemented| Consistent `ApiResponse` envelope               |
| Rate limiting        | ⬜ Deferred   | Phase 2+                                        |
| Input validation     | ⬜ Deferred   | Phase 2+ (Zod or JSON Schema)                   |
| Service forwarding   | ⬜ Deferred   | Phase 2+ (HTTP calls to downstream services)    |

## Endpoints

All endpoints under `/v1` require an `x-api-key` header.

| Method | Path               | Description                        | Status |
| ------ | ------------------ | ---------------------------------- | ------ |
| GET    | `/health`          | Health check (no auth required)    | ✅     |
| POST   | `/v1/tryon`        | Queue a virtual try-on job         | Stub   |
| POST   | `/v1/upload-image` | Upload a user/garment image        | Stub   |
| GET    | `/v1/usage`        | Get tenant usage statistics        | Stub   |

## Folder Structure

```
src/
├── index.ts              # Process entry point (bootstrap)
├── app.ts                # Fastify app factory (testable)
├── config/
│   └── index.ts          # Environment config loader
├── middleware/
│   ├── index.ts          # Barrel export
│   ├── api-key-auth.ts   # API key validation hook
│   ├── request-logger.ts # Request ID + structured logging
│   └── error-handler.ts  # Global error handler
├── routes/
│   └── v1/
│       ├── index.ts      # V1 route aggregator
│       ├── tryon.ts      # POST /v1/tryon
│       ├── upload-image.ts # POST /v1/upload-image
│       └── usage.ts      # GET /v1/usage
└── types/
    └── fastify.d.ts      # Fastify type augmentations
```

## Architecture Decisions

1. **App factory pattern** (`app.ts` vs `index.ts`): Separating app construction from server binding enables testing the full HTTP stack without opening a real port.

2. **Scoped auth hook**: API key auth is registered only on the `/v1` scope, not globally. This keeps `/health` unauthenticated for load balancers.

3. **Request ID propagation**: If the caller sends `x-request-id`, we reuse it. Otherwise we generate one. It's echoed back in the response header for end-to-end traceability.

4. **Consistent error envelope**: Every error response uses `ApiResponse` from `@tryon/shared-types`. Internal errors never leak stack traces.

## Running Locally

```bash
# From the monorepo root
pnpm install
pnpm --filter @tryon/shared-types build
pnpm --filter @tryon/api-gateway dev
```

## Testing the Stubs

```bash
# Health check
curl http://localhost:3000/health

# Authenticated request (mock key)
curl -X POST http://localhost:3000/v1/tryon \
  -H "Content-Type: application/json" \
  -H "x-api-key: tryon_testbrand" \
  -d '{"userImageRef": "img_123", "garmentImageRef": "img_456"}'

# Missing API key → 401
curl -X GET http://localhost:3000/v1/usage
```
