# Security & Privacy

This document describes the security model, data handling practices, and privacy guarantees of the TryOn platform.

---

## Threat model

The TryOn platform processes **user photos** — sensitive personal data. The architecture is designed around these principles:

1. **User images are ephemeral** — temporary by design, auto-deleted.
2. **Tenants are isolated** — one tenant cannot access another's data.
3. **Secrets never travel in plaintext** — API keys are hashed at rest, compared in constant time.
4. **The client is untrusted** — the widget runs on third-party websites; all validation happens server-side.

---

## API key security

### Key format

```
tryon_{prefix}_{secret}
       ^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
       8 chars   32 chars (crypto random)
       stored    NEVER stored
```

- Keys are generated with `crypto.randomBytes()` — cryptographically secure.
- The full key is shown to the tenant **once** at creation time and never again.
- Only the **SHA-256 hash** is stored in the database.

### Key validation

```
Client request                     API Gateway               Tenant Service
─────────────────                  ───────────               ──────────────
x-api-key: tryon_abc_secret…  →   Extract header       →   Hash the key (SHA-256)
                                                             Compare against stored hashes
                                                             (constant-time comparison)
                                                          ←  { valid: true, tenantId, plan }
                                  Attach tenantId
                                  to request context
                                  Route to service     →
```

- **Constant-time comparison** (`crypto.timingSafeEqual`) prevents timing attacks.
- The API gateway never inspects or stores the key — it delegates entirely to the tenant service.
- Keys can be rotated from the dashboard at any time.

### Key exposure protection

| Risk | Mitigation |
|------|-----------|
| Key visible in browser source | Domain allowlisting restricts usage to your domains |
| Key in version control | Use environment variables; keys are prefixed for easy detection by secret scanners |
| Key theft | Rotate keys instantly from the dashboard; old key stops working immediately |
| Brute force | SHA-256 hashing + key length (40+ chars) makes brute force infeasible |

---

## Domain allowlisting

API keys can be restricted to specific origins:

```
Tenant dashboard:
  Allowed domains: ["https://shop.example.com", "*.example.com"]

Browser → API Gateway:
  Origin: https://shop.example.com     ✅ Allowed
  Origin: https://evil.com             ❌ Blocked (403)
  Origin: https://app.example.com      ✅ Allowed (wildcard match)
  No Origin header (server-to-server)  ❌ Blocked when allowlist is configured
```

### How it works

1. Browser includes the `Origin` header automatically (CORS behavior).
2. API gateway forwards the origin to the tenant service.
3. Tenant service checks the origin against the tenant's allowlist.
4. If the allowlist is empty, all origins are permitted (opt-in security).
5. Wildcard matching: `*.example.com` matches any subdomain of `example.com`.

### Recommendations

- **Always configure an allowlist** for production API keys.
- Add all environments: production, staging, preview URLs.
- Use `*.your-domain.com` if you have many subdomains.
- For server-to-server API calls, use a separate key without domain restrictions.

---

## Image data handling

### Lifecycle of a user photo

```
1. UPLOAD      User selects a photo in the widget
                ↓
2. TRANSMIT    Photo sent via HTTPS to API gateway
                ↓
3. STORE       Stored temporarily with a TTL (default: 1 hour)
               Assigned an opaque imageRef (e.g., img_a1b2c3d4…)
                ↓
4. PROCESS     AI generation service reads the image, generates result
                ↓
5. EXPIRE      Image is automatically purged after TTL expires
               The imageRef becomes invalid
                ↓
6. PURGE       Storage layer deletes the actual bytes
               No recovery possible
```

### Privacy guarantees

| Guarantee | Implementation |
|-----------|---------------|
| **Ephemeral by default** | Every image has a TTL (max 24 hours). The type system enforces that all `StoredImageRecord` objects have an `expiresAt` field — there is no permanent storage path in the code. |
| **No permanent storage** | The `IMAGE_POLICY.maxTtlSeconds` is capped at 86,400 seconds (24 hours). No API endpoint accepts a "permanent" TTL. |
| **Auto-purge** | An `ExpiryScheduler` runs periodically and deletes all expired images. This is not a "best effort" — it's a hard requirement enforced at the storage layer. |
| **Opaque references** | Image references (`img_uuid`) reveal no information about the image content, tenant, or storage location. |
| **Tenant isolation** | Images are scoped to a tenant ID. One tenant cannot reference or access another tenant's images. |
| **No training** | User images are never used for AI model training. |

### Image validation

Images are validated **before** processing:

| Check | Limit |
|-------|-------|
| File type | JPEG, PNG, WebP only |
| File size | Max 10 MB |
| Dimensions | Min 128×128 px, max 4,096×4,096 px |
| Content type | Must match the file's actual MIME type |

Invalid images are rejected with a clear error message and never stored.

---

## Data flow diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  BROWSER (end user)                                              │
│                                                                  │
│  1. User uploads photo → File stays in browser memory            │
│  2. Widget sends photo → HTTPS POST to API gateway               │
│  3. Widget polls for result → HTTPS GET from API gateway         │
│  4. Widget displays result → Image URL rendered in <img> tag     │
│  5. User closes widget → Browser revokes local blob URL          │
│                                                                  │
│  ⚠ Photo never leaves the HTTPS channel                         │
│  ⚠ Photo is never stored in localStorage, cookies, or IndexedDB │
│  ⚠ Preview uses URL.createObjectURL() — memory only, revoked    │
└──────────────────────────────────────────────────────────────────┘
         │ HTTPS only
         ▼
┌────────────────────────────────────────────────┐
│  API GATEWAY                                    │
│                                                │
│  - Validates x-api-key (delegates to tenant    │
│    service — never stores the key)             │
│  - Validates Origin (domain allowlisting)      │
│  - Routes to internal services                 │
│  - Never logs image content or request bodies  │
└────────────────────────────────────────────────┘
         │ Internal network only
         ▼
┌────────────────────────────────────────────────┐
│  IMAGE SERVICE                                  │
│                                                │
│  - Stores image with TTL                       │
│  - Returns opaque imageRef                     │
│  - ExpiryScheduler purges expired images       │
│  - Storage interface is pluggable (S3, GCS,    │
│    local) — encryption at rest configurable    │
└────────────────────────────────────────────────┘
```

---

## Transport security

| Layer | Protection |
|-------|-----------|
| Client → API Gateway | HTTPS (TLS 1.2+) enforced |
| API Gateway → Services | Internal network (never exposed publicly) |
| Image storage | Configurable encryption at rest |
| API keys in transit | HTTPS header (`x-api-key`), never in URL |
| Image references | Opaque UUIDs, no information leakage |

---

## Widget security

The embeddable widget runs on third-party websites. Here's how it's secured:

### Style isolation

- All CSS classes are prefixed with `tryon-` to prevent collisions.
- Styles are scoped to the widget container.
- CSS custom properties use the `--tryon-` namespace.

### Script isolation

- The IIFE bundle is a self-contained closure — no global pollution except `window.TryOn`.
- The widget does not modify the host page's DOM outside its container.
- The widget does not read or write cookies, localStorage, or sessionStorage.
- The widget does not access the host page's JavaScript context.

### XSS prevention

- All user-provided strings (API key, garment IDs, etc.) are passed as React props, not injected as HTML.
- Image URLs are rendered via React's `<img src>` — React escapes attributes automatically.
- No `dangerouslySetInnerHTML` is used anywhere in the widget.

### CSP compatibility

The widget works with strict Content Security Policies. Required directives:

```
script-src 'self' https://cdn.tryon.dev;
style-src 'self' https://cdn.tryon.dev 'unsafe-inline';
connect-src 'self' https://api.tryon.dev;
img-src 'self' https://cdn.tryon.dev blob: data:;
```

`blob:` is required for the image preview (generated with `URL.createObjectURL`). `'unsafe-inline'` is required for theme CSS custom properties applied via `element.style.setProperty()`.

---

## GDPR compliance

### Data minimization

- Only the user photo and garment reference are collected — no names, emails, or identifying information.
- The widget does not use cookies or tracking pixels.

### Right to deletion

- User photos are automatically deleted after the TTL expires (max 24 hours).
- For immediate deletion, tenants can call the image service API (future endpoint).

### Lawful basis

The typical lawful basis for processing is **consent** — the user explicitly uploads their photo and clicks "Generate". The widget does not process any data until the user takes action.

### Data processor role

TryOn acts as a **data processor** on behalf of the tenant (the e-commerce store). The tenant is the **data controller**.

| Role | Responsibility |
|------|---------------|
| **Tenant** (your store) | Obtain user consent, display privacy notice, handle data subject requests |
| **TryOn** (processor) | Process images per tenant instructions, auto-delete after TTL, no secondary use |

### Recommended privacy notice

Add this to your site's privacy policy:

> **Virtual Try-On**: We use TryOn to let you preview how clothing items look on you. When you use the "Try it on" feature, your uploaded photo is sent to TryOn's servers for processing. Photos are automatically deleted within 24 hours and are never used for any purpose other than generating your try-on image. See [TryOn's privacy policy](https://tryon.dev/privacy) for details.

---

## Audit trail

Every API request generates:

| Field | Purpose |
|-------|---------|
| `requestId` | Unique ID for tracing a request across services |
| `timestamp` | ISO 8601 timestamp |
| `tenantId` | Which tenant made the request |

These are included in every API response `meta` object and can be used for support debugging without exposing user data.

---

## Security checklist for integrators

- [ ] **API key in environment variable** — never hardcode in source control
- [ ] **Domain allowlist configured** — restrict your key to your production domains
- [ ] **HTTPS enforced** — all pages using the widget must be served over HTTPS
- [ ] **Privacy notice updated** — inform users about photo processing
- [ ] **CSP headers set** — if using a strict Content Security Policy
- [ ] **Key rotation plan** — rotate keys periodically or on team member departure
- [ ] **Staging key separated** — use a different API key for staging/development
- [ ] **Error callbacks implemented** — handle `onError` to log issues to your monitoring

---

## Vulnerability reporting

If you discover a security vulnerability, please report it responsibly:

- Email: security@tryon.dev
- Do **not** open a public GitHub issue for security vulnerabilities
- We aim to respond within 24 hours and resolve within 72 hours
