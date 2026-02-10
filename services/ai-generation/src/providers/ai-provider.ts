import type {
  ProviderGenerateRequest,
  ProviderGenerateResult,
} from "@tryon/shared-types";

/**
 * AI provider interface.
 *
 * ADDING A NEW PROVIDER:
 *   1. Create a class implementing this interface (e.g. ReplicateProvider)
 *   2. Register it in provider-registry.ts
 *   3. Map model tiers to your provider's models in model-registry.ts
 *
 * Each provider handles its own:
 *   - Authentication
 *   - Request formatting (prompt structure, image inputs)
 *   - Response parsing (extracting generated image URLs)
 *   - Error classification (transient vs permanent)
 */
export interface AIProvider {
  /** Unique provider identifier (e.g. "openrouter", "replicate", "mock"). */
  readonly id: string;

  /** Human-readable provider name. */
  readonly displayName: string;

  /**
   * Generate a try-on image.
   * Throws on failure — the caller handles retries.
   */
  generate(request: ProviderGenerateRequest): Promise<ProviderGenerateResult>;
}

/**
 * Thrown by providers to indicate a transient error (worth retrying).
 * E.g. rate limits, 5xx, network timeouts.
 */
export class TransientProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "TransientProviderError";
  }
}

/**
 * Thrown by providers to indicate a permanent error (do NOT retry).
 * E.g. invalid API key, model not found, malformed request.
 */
export class PermanentProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "PermanentProviderError";
  }
}
