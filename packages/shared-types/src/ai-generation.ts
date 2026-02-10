/**
 * AI Generation Service type contracts.
 *
 * Defines the provider-abstraction layer. The AI Generation Service
 * consumes a vendor-agnostic GenerationRequest (from tryon.ts) and
 * invokes a concrete AIProvider implementation.
 *
 * ADDING A NEW PROVIDER:
 *   1. Create a class implementing AIProvider in services/ai-generation/src/providers/
 *   2. Register it in the ProviderRegistry (provider-registry.ts)
 *   3. Map model tiers to the new provider's models in model-registry.ts
 *   4. No other service needs to change — the orchestrator remains unaware.
 *
 * ADDING A NEW MODEL:
 *   1. Add an entry to model-registry.ts mapping ModelTier → provider + model ID
 *   2. Optionally update the default prompt builder if the model needs special prompts
 */

import type { ModelTier } from "./tryon.js";
import type { GarmentType } from "./garment.js";

// ─── Provider Abstraction ────────────────────────────────────────────────────

/**
 * A concrete model resolved from a ModelTier.
 * E.g. { providerId: "openrouter", modelId: "bytedance-seed/seedream-4.5" }
 */
export interface ResolvedModel {
  /** Which registered provider to use. */
  providerId: string;
  /** Provider-specific model identifier. */
  modelId: string;
  /** Human label for logging/display. */
  displayName: string;
}

/**
 * The payload passed to an AIProvider.generate() call.
 * Already resolved to a specific model — no tier logic here.
 */
export interface ProviderGenerateRequest {
  /** Resolved model identifier. */
  model: ResolvedModel;
  /** URL of the user photo. */
  userImageUrl: string;
  /** URL of the garment product image. */
  garmentImageUrl: string;
  /** Optional garment mask URL. */
  garmentMaskUrl?: string;
  /** Garment type for prompt building. */
  garmentType: GarmentType;
  /** Text prompt for the AI model. */
  prompt: string;
  /** Extra generation parameters (seed, aspect ratio, etc.). */
  parameters: Record<string, unknown>;
}

/**
 * Result from a successful AI generation.
 */
export interface ProviderGenerateResult {
  /** Base64 data URL or hosted URL of the generated image. */
  imageUrl: string;
  /** Wall-clock processing time in ms. */
  processingTimeMs: number;
  /** The model ID that was actually used. */
  modelId: string;
}

// ─── POST /generate ──────────────────────────────────────────────────────────

/**
 * Request body for the AI Generation Service's HTTP endpoint.
 * This is the GenerationRequest from tryon.ts, forwarded by the orchestrator.
 */
export interface AIGenerateRequest {
  jobId: string;
  tenantId: string;
  modelTier: ModelTier;
  garmentType: GarmentType;
  userImageUrl: string;
  garmentImageUrl: string;
  garmentMaskUrl?: string;
  parameters: Record<string, unknown>;
}

/**
 * Response from the AI Generation Service.
 */
export interface AIGenerateResult {
  jobId: string;
  imageUrl: string;
  processingTimeMs: number;
  modelId: string;
}
