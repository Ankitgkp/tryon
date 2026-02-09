# Image Service

## Overview

The Image Service handles **temporary image uploads** for the try-on platform. It generates pre-signed URLs for client-side uploads and validates image metadata against policy constraints.

## ⚠️ Privacy Policy

> **Images are NEVER permanently stored.**
>
> Every image has a mandatory TTL (time-to-live). The expiry scheduler automatically purges expired images from both the metadata store and object storage. There is no code path for permanent storage. This is an intentional architectural constraint.

| Privacy Guarantee                        | Enforcement                                    |
| ---------------------------------------- | ---------------------------------------------- |
| All images have a TTL                    | `StoredImageRecord.expiresAt` is required       |
| Expired images are auto-deleted          | `ExpiryScheduler` runs on an interval           |
| No permanent storage API exists          | No endpoint or method to disable expiry         |
| Image refs are opaque                    | UUIDs — no tenant/user info in the ref          |
| Storage keys are internal                | Never returned to clients                       |
| Max TTL is capped                        | `IMAGE_POLICY.maxTtlSeconds` (24h)              |
| Default TTL is conservative              | `IMAGE_POLICY.defaultTtlSeconds` (1h)           |

## Endpoints

| Method | Path               | Description                              | Status |
| ------ | ------------------ | ---------------------------------------- | ------ |
| GET    | `/health`          | Health check + tracked image count       | ✅     |
| POST   | `/upload-url`      | Generate pre-signed upload URL           | ✅     |
| POST   | `/validate-image`  | Validate image dimensions after upload   | ✅     |

### POST /upload-url

**Request:**
```json
{
  "contentType": "image/jpeg",
  "fileSizeBytes": 2048000,
  "purpose": "user-photo",
  "ttlSeconds": 3600
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "http://localhost:3002/mock-storage/user-photo/img_abc123?token=...",
    "imageRef": "img_abc123",
    "method": "PUT",
    "requiredHeaders": {
      "Content-Type": "image/jpeg",
      "Content-Length": "2048000"
    },
    "uploadExpiresAt": "2026-02-09T13:15:00.000Z",
    "imageExpiresAt": "2026-02-09T14:00:00.000Z"
  }
}
```

### POST /validate-image

**Request:**
```json
{
  "imageRef": "img_abc123",
  "widthPx": 1024,
  "heightPx": 768
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "imageRef": "img_abc123",
    "violations": []
  }
}
```

## Image Policy

| Constraint     | Value              |
| -------------- | ------------------ |
| Max file size  | 10 MB              |
| Max dimensions | 4096 × 4096 px     |
| Min dimensions | 128 × 128 px       |
| Allowed types  | JPEG, PNG, WebP     |
| Default TTL    | 1 hour              |
| Max TTL        | 24 hours            |

## Folder Structure

```
src/
├── index.ts                  # Process entry point
├── app.ts                    # Fastify app factory
├── config/
│   └── index.ts              # Environment config
├── storage/
│   ├── index.ts              # Barrel export
│   ├── storage-provider.ts   # ObjectStorageProvider interface
│   └── mock-storage-provider.ts  # In-memory mock (dev/test)
├── store/
│   ├── index.ts              # Barrel export
│   ├── image-record-store.ts # ImageRecordStore interface
│   └── in-memory-image-record-store.ts  # In-memory implementation
├── services/
│   ├── index.ts              # Barrel export
│   ├── image-validator.ts    # Policy validation logic
│   └── expiry-scheduler.ts   # Periodic cleanup of expired images
└── routes/
    ├── index.ts              # Barrel export
    ├── upload-url.ts         # POST /upload-url
    └── validate-image.ts     # POST /validate-image
```

## Architecture Decisions

1. **Storage provider interface**: `ObjectStorageProvider` is an abstraction over S3/GCS/etc. The mock implementation runs in-memory for development. Swap it without touching any route code.

2. **Two-phase upload**: Clients first get a pre-signed URL, then upload directly to storage. This keeps large binary payloads off the API server and enables CDN-edge uploads in production.

3. **Record store vs. storage provider**: Metadata (refs, expiry, status) is tracked separately from the binary objects. This allows querying records without hitting the storage backend.

4. **Expiry scheduler**: Runs as `setInterval` in the service process for simplicity. In production, this would be a separate cron job or cloud function to avoid coupling cleanup to service availability.

5. **Client-reported dimensions**: For now, `POST /validate-image` trusts the client's reported width/height. In a future phase, the service should read actual dimensions from the uploaded file.

## Running Locally

```bash
# From the monorepo root
pnpm install
pnpm --filter @tryon/shared-types build
pnpm --filter @tryon/image-service dev
```
