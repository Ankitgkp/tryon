import type { ModelTier, ResolvedModel } from "@tryon/shared-types";

/**
 * Maps abstract ModelTiers to concrete provider + model identifiers.
 *
 * ADDING A NEW MODEL:
 *   1. Add an entry below mapping the tier to a ResolvedModel
 *   2. Ensure the provider is registered in provider-registry.ts
 *   3. No other service needs to change
 *
 * SWITCHING THE DEFAULT MODEL:
 *   Just change the modelId and displayName for the relevant tier.
 */

const MODEL_MAP: Record<ModelTier, ResolvedModel> = {
  standard: {
    providerId: "openrouter",
    modelId: "bytedance-seed/seedream-4.5",
    displayName: "Seedream 4.5 (Standard)",
  },
  premium: {
    providerId: "openrouter",
    modelId: "bytedance-seed/seedream-4.5",
    displayName: "Seedream 4.5 (Premium)",
  },
  experimental: {
    providerId: "openrouter",
    modelId: "bytedance-seed/seedream-4.5",
    displayName: "Seedream 4.5 (Experimental)",
  },
};

/**
 * Resolve a model tier to a concrete provider + model ID.
 */
export function resolveModel(tier: ModelTier): ResolvedModel {
  const model = MODEL_MAP[tier];
  if (!model) {
    throw new Error(`Unknown model tier: ${tier}`);
  }
  return model;
}

/**
 * List all registered model mappings (for health/debug endpoints).
 */
export function listModelMappings(): Record<ModelTier, ResolvedModel> {
  return { ...MODEL_MAP };
}
