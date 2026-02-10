# @tryon/garment-service

Manages the **garment catalog** for virtual try-on.  
Tenants register their clothing items here so the try-on engine knows what to composite onto user photos.

## Endpoints

| Method | Path             | Description                |
| ------ | ---------------- | -------------------------- |
| GET    | `/health`        | Liveness probe             |
| POST   | `/garment`       | Create a new garment       |
| GET    | `/garment/:id`   | Retrieve garment by ID     |

## Architecture

```
src/
├── app.ts              # Fastify app factory
├── index.ts            # Entry point
├── config/             # Environment config loader
├── routes/             # HTTP route handlers
│   └── garment.ts      # POST + GET /garment
├── services/           # Business-logic helpers
│   └── garment-validator.ts  # Request validation
└── store/              # Data-access layer (interface + in-memory)
    ├── garment-store.ts
    └── in-memory-garment-store.ts
```

## Running

```bash
# From workspace root
pnpm install
pnpm --filter @tryon/shared-types build
pnpm --filter @tryon/garment-service build
pnpm --filter @tryon/garment-service start
```

Default port: **3003**

## Dev mode

```bash
pnpm --filter @tryon/garment-service dev
```
