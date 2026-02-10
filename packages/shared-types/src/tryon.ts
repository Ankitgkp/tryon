/**
 * Try-On Orchestrator type contracts.
 *
 * The orchestrator coordinates the try-on pipeline:
 *   1. Validate that the user-image and garment exist & are usable
 *   2. Select an AI model based on garment type, tenant plan, etc.
 *   3. Build a vendor-agnostic generation request
 *   4. Dispatch to the AI Generation Service (future Phase 6)
 *   5. Track job lifecycle (queued → processing → completed | failed)
 *
 * IMPORTANT: This module MUST remain vendor-agnostic.
 * No OpenRouter, Replicate, or any provider-specific types here.
 */

import type { GarmentType } from "./garment.js";
import type { TenantPlan } from "./tenant.js";

// ─── Job Status ──────────────────────────────────────────────────────────────

export const TRYON_JOB_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
] as const;

export type TryOnJobStatus = (typeof TRYON_JOB_STATUSES)[number];

// ─── AI Model Selection ──────────────────────────────────────────────────────

/**
 * Abstract model tier — the orchestrator picks a tier, the AI Generation
 * Service resolves it to a concrete provider + model.
 */
export const MODEL_TIERS = ["standard", "premium", "experimental"] as const;
export type ModelTier = (typeof MODEL_TIERS)[number];

/**
 * Vendor-agnostic generation request.
 * Built by the orchestrator, consumed by the AI Generation Service.
 */
export interface GenerationRequest {
  /** Unique job reference (same as TryOnJob.id). */
  jobId: string;
  /** Tenant owning the job. */
  tenantId: string;
  /** Resolved model tier. */
  modelTier: ModelTier;
  /** Garment type — lets the AI service pick body-region-aware models. */
  garmentType: GarmentType;
  /** URL of the user's photo (pre-signed or internal). */
  userImageUrl: string;
  /** URL of the garment product image. */
  garmentImageUrl: string;
  /** Optional garment mask URL. */
  garmentMaskUrl?: string;
  /** Free-form generation parameters. */
  parameters: Record<string, unknown>;
}

/**
 * Result returned by the AI Generation Service (future).
 * The orchestrator stores this inside the job record.
 */
export interface GenerationResult {
  /** URL of the generated try-on image. */
  resultImageUrl: string;
  /** Processing time in milliseconds. */
  processingTimeMs: number;
  /** Opaque model identifier used (e.g. "standard-v2"). */
  modelId: string;
}

// ─── POST /tryon ─────────────────────────────────────────────────────────────

export interface CreateTryOnRequest {
  /** Image reference (from image-service) or URL of the user photo. */
  userImageRef: string;
  /** Garment ID (from garment-service). */
  garmentId: string;
  /** Optional model tier override. Default determined by tenant plan. */
  modelTier?: ModelTier;
  /** Optional extra generation parameters. */
  parameters?: Record<string, unknown>;
}

export interface CreateTryOnResult {
  jobId: string;
  status: TryOnJobStatus;
  createdAt: string;
}

// ─── GET /tryon/:jobId ───────────────────────────────────────────────────────

/** Full job record returned to callers. */
export interface TryOnJob {
  id: string;
  tenantId: string;
  status: TryOnJobStatus;

  /** Input references. */
  userImageRef: string;
  garmentId: string;

  /** Model selection metadata. */
  modelTier: ModelTier;

  /** Present when status === "completed". */
  result?: GenerationResult;

  /** Present when status === "failed". */
  failureReason?: string;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}

// ─── Model Selection Hint ────────────────────────────────────────────────────

/**
 * Input to the model-selection logic.
 * The orchestrator assembles this; the model-selector returns a ModelTier.
 */
export interface ModelSelectionContext {
  tenantPlan: TenantPlan;
  garmentType: GarmentType;
  /** Explicit override from the caller, if any. */
  requestedTier?: ModelTier;
}
