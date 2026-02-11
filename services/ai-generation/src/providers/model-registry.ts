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
    modelId: "sourceful/riverflow-v2-fast-preview",
    displayName: "Riverflow V2 Fast (Standard — $0.03/img)",
  },
  premium: {
    providerId: "openrouter",
    modelId: "sourceful/riverflow-v2-standard-preview",
    displayName: "Riverflow V2 Standard (Premium — $0.035/img)",
  },
  experimental: {
    providerId: "openrouter",
    modelId: "sourceful/riverflow-v2-max-preview",
    displayName: "Riverflow V2 Max (Experimental — $0.075/img)",
  },
};


export function resolveModel(tier: ModelTier): ResolvedModel {
  const model = MODEL_MAP[tier];
  if (!model) {
    throw new Error(`Unknown model tier: ${tier}`);
  }
  return model;
}

export function listModelMappings(): Record<ModelTier, ResolvedModel> {
  return { ...MODEL_MAP };
}
