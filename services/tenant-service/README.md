# Tenant Service

## Overview

The Tenant Service manages **tenants (brands)** and their authentication credentials. It is the single source of truth for:

- Who is allowed to call the platform APIs
- What plan they're on
- What domains are allowed to use their keys

This service has **zero knowledge of AI, try-on, or image processing**. It is purely about identity and access.

## Responsibilities

| Concern              | Status         | Notes                                             |
| -------------------- | -------------- | ------------------------------------------------- |
| API key validation   | ✅ Implemented | Constant-time hash comparison, domain allowlist   |
| Tenant lookup        | ✅ Implemented | Public-safe projection (no key material exposed)  |
| Key generation       | ✅ Implemented | Secure random keys, SHA-256 hashing               |
| Domain allowlisting  | ✅ Implemented | Wildcard subdomain support                        |
| In-memory storage    | ✅ Implemented | Seeded with demo tenants + stable dev key         |
| Database storage     | ⬜ Deferred    | Phase 3+ (interface is ready for swap)            |
| Key rotation         | ⬜ Deferred    | Phase 3+                                          |
| Tenant CRUD API      | ⬜ Deferred    | Phase 3+ (admin endpoints)                        |

## Endpoints

| Method | Path             | Description                             | Caller          |
| ------ | ---------------- | --------------------------------------- | --------------- |
| GET    | `/health`        | Health check                            | Load balancer   |
| POST   | `/validate-key`  | Validate an API key + optional origin   | API Gateway     |
| GET    | `/tenant/:id`    | Get public tenant info by ID            | Internal services |

### POST /validate-key

**Request:**
```json
{
  "apiKey": "tryon_abc12345_secret...",
  "origin": "https://shop.example.com"
}
```

**Response (valid):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "tenantId": "tenant_acme",
    "plan": "pro"
  }
}
```

**Response (invalid):**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "reason": "Invalid API key."
  }
}
```

### GET /tenant/:id

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tenant_acme",
    "name": "Acme Fashion",
    "plan": "pro",
    "allowedDomains": [],
    "createdAt": "2026-02-09T12:00:00.000Z"
  }
}
```

## Folder Structure

```
src/
├── index.ts              # Process entry point
├── app.ts                # Fastify app factory
├── config/
│   └── index.ts          # Environment config
├── services/
│   ├── index.ts          # Barrel export
│   ├── api-key-service.ts  # Key generation, hashing, comparison
│   └── domain-service.ts   # Domain allowlist validation
├── store/
│   ├── index.ts          # Barrel export
│   ├── tenant-store.ts   # Store interface (contract)
│   └── in-memory-tenant-store.ts  # In-memory implementation + seeding
└── routes/
    ├── index.ts          # Barrel export
    ├── validate-key.ts   # POST /validate-key
    └── tenant.ts         # GET /tenant/:id
```

## Security Design

1. **API keys are never stored in plaintext.** Only SHA-256 hashes are persisted. The plaintext is shown once at creation time.

2. **Constant-time comparison** via `crypto.timingSafeEqual` prevents timing attacks on key validation.

3. **Key format** (`tryon_{prefix}_{secret}`) allows prefix-based lookup without scanning all keys, while the secret portion provides the actual authentication.

4. **Domain allowlisting** is opt-in. An empty allowlist means no restrictions. When configured, requests without an `Origin` header are rejected.

5. **Public tenant responses** never include `apiKeyHash` or `apiKeyPrefix`.

## Development

```bash
# From monorepo root
pnpm install
pnpm --filter @tryon/shared-types build
pnpm --filter @tryon/tenant-service dev

# Stable dev key (always the same across restarts):
# tryon_dev00000_dev000000000000000000000000000000
```

## Integration with API Gateway

The API Gateway calls `POST /validate-key` on every authenticated request. Configure via:

```bash
TENANT_SERVICE_URL=http://localhost:3001  # in api-gateway .env
```
