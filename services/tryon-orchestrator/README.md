# @tryon/tryon-orchestrator

Coordinates the **virtual try-on pipeline** — validates inputs, selects the AI model tier, builds a vendor-agnostic generation request, and tracks job lifecycle.

**This service NEVER calls an AI provider directly.** It produces a `GenerationRequest` that the AI Generation Service (Phase 6) will consume.

## Endpoints

| Method | Path            | Description                          |
| ------ | --------------- | ------------------------------------ |
| GET    | `/health`       | Liveness probe                       |
| POST   | `/tryon`        | Create a try-on job                  |
| GET    | `/tryon/:jobId` | Poll job status / retrieve result    |

## Architecture

```
src/
├── app.ts                  # Fastify app factory
├── index.ts                # Entry point
├── config/                 # Environment config loader
├── clients/                # HTTP clients for downstream services
│   ├── garment-client.ts   # Calls garment-service
│   └── image-client.ts     # Calls image-service
├── routes/
│   └── tryon.ts            # POST + GET /tryon
├── services/               # Orchestration logic
│   ├── model-selector.ts   # Picks model tier from tenant plan + garment type
│   ├── orchestrator.ts     # Core pipeline: validate → select → build → persist
│   └── tryon-validator.ts  # Request shape validation
└── store/                  # Job persistence (interface + in-memory)
    ├── job-store.ts
    └── in-memory-job-store.ts
```

## Pipeline Flow

```
POST /tryon
  │
  ├─ 1. Validate request shape (tryon-validator)
  ├─ 2. Verify garment exists (garment-client → garment-service)
  ├─ 3. Verify user image exists & is valid (image-client → image-service)
  ├─ 4. Select model tier (model-selector)
  ├─ 5. Build GenerationRequest (vendor-agnostic)
  ├─ 6. Persist TryOnJob as "queued" (job-store)
  └─ 7. Return 202 Accepted with jobId
        │
        └─ [Phase 6] Dispatch GenerationRequest to AI Generation Service
```

## Running

```bash
# From workspace root
pnpm install
pnpm --filter @tryon/shared-types build
pnpm --filter @tryon/tryon-orchestrator build
pnpm --filter @tryon/tryon-orchestrator start
```

Default port: **3004**

## Dev mode

```bash
pnpm --filter @tryon/tryon-orchestrator dev
```

## Dependencies

Requires these services to be running for full functionality:

- **image-service** on `http://localhost:3002` (configurable via `IMAGE_SERVICE_URL`)
- **garment-service** on `http://localhost:3003` (configurable via `GARMENT_SERVICE_URL`)
