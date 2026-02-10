import type {
  ProviderGenerateRequest,
  ProviderGenerateResult,
} from "@tryon/shared-types";
import type { AIProvider } from "./ai-provider.js";

/**
 * Mock AI provider for development and testing.
 *
 * Returns a deterministic placeholder image (a 1x1 transparent PNG as
 * base64 data URL) after a simulated delay. No API key required.
 */
export class MockProvider implements AIProvider {
  readonly id = "mock";
  readonly displayName = "Mock Provider (development)";

  private readonly simulatedDelayMs: number;

  constructor(simulatedDelayMs = 500) {
    this.simulatedDelayMs = simulatedDelayMs;
  }

  async generate(
    request: ProviderGenerateRequest,
  ): Promise<ProviderGenerateResult> {
    const startTime = Date.now();

    // Simulate processing time
    await new Promise((resolve) =>
      setTimeout(resolve, this.simulatedDelayMs),
    );

    const processingTimeMs = Date.now() - startTime;

    // 1x1 transparent PNG as a base64 data URL (valid image for downstream)
    const placeholderImage =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    return {
      imageUrl: placeholderImage,
      processingTimeMs,
      modelId: `mock/${request.model.modelId}`,
    };
  }
}
