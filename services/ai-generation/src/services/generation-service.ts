import type {
  AIGenerateRequest,
  AIGenerateResult,
  ProviderGenerateRequest,
} from "@tryon/shared-types";
import type { ProviderRegistry } from "../providers/provider-registry.js";
import { resolveModel } from "../providers/model-registry.js";
import { buildTryOnPrompt } from "./prompt-builder.js";
import { withRetry } from "./retry.js";

interface GenerationServiceDeps {
  providerRegistry: ProviderRegistry;
  maxRetries: number;
  retryBaseDelayMs: number;
  log: (msg: string, data?: Record<string, unknown>) => void;
}

/**
 * Core generation logic.
 *
 * 1. Resolve model tier → concrete provider + model
 * 2. Build prompt
 * 3. Call provider with retries
 * 4. Return result
 *
 * No tenant logic, no job state — pure AI dispatch.
 */
export async function generateImage(
  request: AIGenerateRequest,
  deps: GenerationServiceDeps,
): Promise<AIGenerateResult> {
  const { providerRegistry, maxRetries, retryBaseDelayMs, log } = deps;

  // 1. Resolve model
  const model = resolveModel(request.modelTier);
  log("Model resolved", {
    tier: request.modelTier,
    providerId: model.providerId,
    modelId: model.modelId,
  });

  // 2. Get provider
  const provider = providerRegistry.getOrThrow(model.providerId);

  // 3. Build prompt
  const prompt = buildTryOnPrompt(
    request.garmentType,
    request.parameters["promptSuffix"] as string | undefined,
  );

  // 4. Build provider request
  const providerRequest: ProviderGenerateRequest = {
    model,
    userImageUrl: request.userImageUrl,
    garmentImageUrl: request.garmentImageUrl,
    garmentMaskUrl: request.garmentMaskUrl,
    garmentType: request.garmentType,
    prompt,
    parameters: request.parameters,
  };

  // 5. Call provider with retries
  const result = await withRetry(
    () => provider.generate(providerRequest),
    { maxRetries, baseDelayMs: retryBaseDelayMs, log },
  );

  log("Image generated", {
    jobId: request.jobId,
    modelId: result.modelId,
    processingTimeMs: result.processingTimeMs,
  });

  return {
    jobId: request.jobId,
    imageUrl: result.imageUrl,
    processingTimeMs: result.processingTimeMs,
    modelId: result.modelId,
  };
}
