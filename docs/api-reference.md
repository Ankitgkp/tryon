# REST API Reference

Base URL: `https://api.tryon.dev/v1`

All requests require an `x-api-key` header. Every response follows the standard envelope.

---

## Authentication

Every request must include your API key in the `x-api-key` header:

```bash
curl -X POST https://api.tryon.dev/v1/tryon \
  -H "x-api-key: tryon_abc12345_secret…" \
  -H "Content-Type: application/json" \
  -d '{ "userImageRef": "img_…", "garmentId": "gmt_…" }'
```

API keys are issued from the TryOn dashboard. They follow the format `tryon_{prefix}_{secret}`.

### Key security

- Keys are **hashed with SHA-256** before storage — we never store plaintext.
- Key validation uses **constant-time comparison** to prevent timing attacks.
- The `prefix` segment (`tryon_abc12345`) is stored separately for identification.

### Domain allowlisting

If you configure an allowlist in the dashboard, the API will reject requests from unlisted origins. Wildcard subdomains are supported:

| Allowlist entry | Matches |
|-----------------|---------|
| `https://shop.example.com` | Exact match only |
| `*.example.com` | `app.example.com`, `shop.example.com`, etc. |
| *(empty)* | All origins allowed (default) |

---

## Response envelope

Every response follows this shape:

```ts
{
  success: boolean;
  data?: T;                
  error?: {
    code: string;          
    message: string;       
  };
  meta?: {
    requestId: string;     
    timestamp: string;     
  };
}
```

### Error codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `MISSING_API_KEY` | 401 | No `x-api-key` header provided |
| `INVALID_API_KEY` | 401 | Key is invalid or revoked |
| `DOMAIN_NOT_ALLOWED` | 403 | Request origin not in tenant's allowlist |
| `INVALID_INPUT` | 400 | Missing or malformed request body |
| `NOT_FOUND` | 404 | Resource does not exist |
| `GENERATION_FAILED` | 500 | AI generation failed |
| `TIMEOUT` | 504 | Job did not complete in time |
| `AUTH_SERVICE_ERROR` | 502 | Internal auth service unavailable |

---

## Endpoints

### `POST /v1/upload-image`

Upload a user photo and receive a temporary image reference.

**Request** — `multipart/form-data`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | `File` | JPEG, PNG, or WebP. Max 10 MB. |

**Response** — `201 Created`:

```json
{
  "success": true,
  "data": {
    "imageRef": "img_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "expiresAt": "2026-02-10T13:00:00.000Z"
  }
}
```

**Notes**:
- Image references expire after **1 hour** by default.
- Expired images are automatically purged — they cannot be recovered.
- Accepted types: `image/jpeg`, `image/png`, `image/webp`.
- Max file size: **10 MB**.
- Image dimensions: min 128×128 px, max 4096×4096 px.

**cURL example**:

```bash
curl -X POST https://api.tryon.dev/v1/upload-image \
  -H "x-api-key: tryon_abc12345_secret…" \
  -F "image=@photo.jpg"
```

---

### `POST /v1/tryon`

Create a virtual try-on job. The job is processed asynchronously.

**Request** — `application/json`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userImageRef` | `string`| Image ref from `/upload-image` |
| `garmentId` | `string`  | ID of a garment from the catalog |
| `garmentImageUrl` | `string` | Direct URL to a garment image |
| `garmentType` | `string` | Required with `garmentImageUrl` |

*Provide either `garmentId` OR both `garmentImageUrl` + `garmentType`.

**Garment types**: `TOP`, `BOTTOM`, `DRESS`, `OUTERWEAR`, `ACCESSORY`

**Response** — `202 Accepted`:

```json
{
  "success": true,
  "data": {
    "jobId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "queued",
    "createdAt": "2026-02-10T12:00:00.000Z"
  }
}
```

**cURL example — with garment ID**:

```bash
curl -X POST https://api.tryon.dev/v1/tryon \
  -H "x-api-key: tryon_abc12345_secret…" \
  -H "Content-Type: application/json" \
  -d '{
    "userImageRef": "img_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "garmentId": "gmt_abc123"
  }'
```

**cURL example — with garment image URL**:

```bash
curl -X POST https://api.tryon.dev/v1/tryon \
  -H "x-api-key: tryon_abc12345_secret…" \
  -H "Content-Type: application/json" \
  -d '{
    "userImageRef": "img_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "garmentImageUrl": "https://shop.example.com/products/shirt.jpg",
    "garmentType": "TOP"
  }'
```

---

### `GET /v1/tryon/:jobId`

Poll a try-on job for status and results.

**Response** — `200 OK`:

```json
{
  "success": true,
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "completed",
    "result": {
      "resultImageUrl": "https://cdn.tryon.dev/results/…",
      "processingTimeMs": 8432,
      "modelId": "bytedance-seed/seedream-4.5"
    }
  }
}
```

**Job statuses**:

| Status | Meaning |
|--------|---------|
| `queued` | Job received, waiting for processing |
| `processing` | AI is generating the image |
| `completed` | Result is ready — `result` field populated |
| `failed` | Generation failed — `failureReason` field populated |

**Polling strategy**: Poll every 2 seconds. Time out after 3 minutes (90 attempts). The SDK handles this automatically.

---

### `GET /v1/usage`

Get usage statistics for the authenticated tenant.

**Response** — `200 OK`:

```json
{
  "success": true,
  "data": {
    "tenantId": "tenant_abc123",
    "period": "2026-02",
    "tryOnCount": 142,
    "uploadCount": 156
  }
}
```

---

## Complete flow example

Here's the full 3-step flow using cURL:

```bash
# 1. Upload user photo
IMAGE_REF=$(curl -s -X POST https://api.tryon.dev/v1/upload-image \
  -H "x-api-key: $TRYON_API_KEY" \
  -F "image=@user-photo.jpg" | jq -r '.data.imageRef')

echo "Image ref: $IMAGE_REF"

# 2. Create try-on job
JOB_ID=$(curl -s -X POST https://api.tryon.dev/v1/tryon \
  -H "x-api-key: $TRYON_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"userImageRef\": \"$IMAGE_REF\", \"garmentId\": \"gmt_abc123\"}" \
  | jq -r '.data.jobId')

echo "Job ID: $JOB_ID"

# 3. Poll until complete
while true; do
  RESULT=$(curl -s https://api.tryon.dev/v1/tryon/$JOB_ID \
    -H "x-api-key: $TRYON_API_KEY")

  STATUS=$(echo $RESULT | jq -r '.data.status')
  echo "Status: $STATUS"

  if [ "$STATUS" = "completed" ]; then
    echo $RESULT | jq '.data.result'
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Failed: $(echo $RESULT | jq -r '.data.failureReason')"
    break
  fi

  sleep 2
done
```

---

## Rate limits

| Plan | Try-ons / month | Uploads / month |
|------|-----------------|-----------------|
| Free | 50 | 100 |
| Starter | 500 | 1,000 |
| Pro | 5,000 | 10,000 |
| Enterprise | Custom | Custom |

Rate limit headers are included in every response:

```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 342
X-RateLimit-Reset: 1707609600
```

---

## SDKs

If you don't want to call the REST API directly, use the widget SDK which wraps all of this in a drop-in UI component:

- [React integration guide](integration-react.md)
- [HTML / script tag guide](integration-html.md)
- [Shopify guide](integration-shopify.md)
- [WordPress guide](integration-wordpress.md)
