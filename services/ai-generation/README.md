# AI Generation Service

Vendor-agnostic AI image-generation service for the TryOn platform. It receives generation requests from the Try-On Orchestrator and dispatches them to the appropriate AI provider.

## Port

`3005` (default)

## Endpoints

| Method | Path        | Description                                      |
| ------ | ----------- | ------------------------------------------------ |
| GET    | `/health`   | Service health check, shows active provider mode |
| POST   | `/generate` | Generate a try-on image                          |
| GET    | `/models`   | List model-tier mappings and registered providers |

### POST `/generate`

**Request body:**

```json
{
  "jobId": "uuid-string",
  "tenantId": "uuid-string",
  "modelTier": "standard" | "premium" | "ultra",
  "garmentType": "t-shirt" | "shirt" | "dress" | "jacket" | "pants" | "skirt" | "shorts" | "hoodie" | "sweater" | "coat",
  "userImageUrl": "https://…",
  "garmentImageUrl": "https://…",
  "garmentMaskUrl": "https://…",         // optional
  "parameters": { "guidance": 7.5 }       // optional
}
```

**Success response (200):**

```json
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "imageUrl": "data:image/png;base64,…",
    "processingTimeMs": 3420,
    "modelId": "bytedance-seed/seedream-4.5"
  }
}
```

**Error responses:**

| Status | Meaning                                            |
| ------ | -------------------------------------------------- |
| 400    | Invalid or missing request fields                  |
| 422    | Provider rejected the request (permanent error)    |
| 502    | Provider unreachable or transient failure after retries |

### GET `/models`

Returns the current model-tier mappings and list of registered providers.

## Architecture

```
Request → Validator → Model Registry → Provider Registry → AI Provider → Response
                         ↓                    ↓
                   resolveModel()       getOrThrow(id)
                   (tier → model)       (id → provider)
```

### Key Concepts

- **AIProvider**: Interface implemented by each vendor integration (OpenRouter, Mock, future providers).
- **ProviderRegistry**: Map of provider ID → AIProvider instance. Registered at boot time.
- **ModelRegistry**: Static map of `ModelTier` → `{ providerId, modelId }`. Determines which provider and model handle each tier.
- **PromptBuilder**: Builds structured prompts per garment type.
- **Retry**: Exponential backoff with jitter. Only retries `TransientProviderError`.

### Error Classification

Each provider classifies errors into:

| Error Type               | Retryable? | HTTP status returned |
| ------------------------ | ---------- | -------------------- |
| `TransientProviderError` | Yes        | 502                  |
| `PermanentProviderError` | No         | 422                  |

## Configuration

| Env Variable          | Default       | Description                       |
| --------------------- | ------------- | --------------------------------- |
| `PORT`                | `3005`        | Service port                      |
| `HOST`                | `0.0.0.0`    | Bind address                      |
| `NODE_ENV`            | `development` | Environment                       |
| `LOG_LEVEL`           | `info`        | Pino log level                    |
| `AI_PROVIDER_MODE`    | `mock`        | `mock` or `openrouter`            |
| `OPENROUTER_API_KEY`  | —             | Required when mode is `openrouter` |
| `MAX_RETRIES`         | `3`           | Max retries for transient errors  |
| `RETRY_BASE_DELAY_MS` | `1000`        | Base delay between retries (ms)   |

## Running

```bash
# Development (mock mode, no API key needed)
pnpm --filter @tryon/ai-generation dev

# Production (requires OPENROUTER_API_KEY)
AI_PROVIDER_MODE=openrouter OPENROUTER_API_KEY=sk-or-… pnpm --filter @tryon/ai-generation start
```

## Adding a New Provider

1. **Create a provider class** in `src/providers/` implementing `AIProvider`:

   ```ts
   import type { AIProvider, ProviderGenerateRequest, ProviderGenerateResult } from "./ai-provider.js";

   export class MyProvider implements AIProvider {
     readonly id = "my-provider";
     readonly displayName = "My Provider";

     async generate(request: ProviderGenerateRequest): Promise<ProviderGenerateResult> {
       // Call your vendor's SDK/API here
       // Throw TransientProviderError for retryable failures
       // Throw PermanentProviderError for non-retryable failures
     }
   }
   ```

2. **Register the provider** in `src/app.ts`:

   ```ts
   providerRegistry.register(new MyProvider(config.myProviderKey));
   ```

3. **Update model mappings** in `src/providers/model-registry.ts`:

   ```ts
   export const MODEL_MAP: Record<ModelTier, ResolvedModel> = {
     standard: { providerId: "my-provider", modelId: "my-model-v1", displayName: "My Model" },
     premium:  { providerId: "openrouter", modelId: "bytedance-seed/seedream-4.5", displayName: "SeedREAM 4.5" },
     ultra:    { providerId: "openrouter", modelId: "bytedance-seed/seedream-4.5", displayName: "SeedREAM 4.5" },
   };
   ```

4. **Export** from `src/providers/index.ts`.

## Adding a New Model (Same Provider)

Simply update `MODEL_MAP` in `src/providers/model-registry.ts` to point the desired tier at the new model ID. No code changes required — just update the mapping.
