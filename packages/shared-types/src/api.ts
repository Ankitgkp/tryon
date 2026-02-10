/**
 * API-level type contracts shared across services.
 * These define the shape of all REST request/response bodies.
 */

// ─── Standard API Envelope ───────────────────────────────────────────────────

/** Every API response follows this envelope for consistency. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  /** Optional machine-readable details for debugging (never leak internals). */
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

// ─── POST /v1/tryon ──────────────────────────────────────────────────────────
//
// Try-on request/result types have moved to ./tryon.ts with richer
// orchestrator-aware contracts (CreateTryOnRequest, CreateTryOnResult,
// TryOnJob, TryOnJobStatus, etc.).
//
// The old TryOnRequest / TryOnResult / TryOnJobStatus stubs are removed to
// avoid duplication. Import from "@tryon/shared-types" — the barrel
// re-exports everything from tryon.ts.

// ─── POST /v1/upload-image ───────────────────────────────────────────────────

export interface UploadImageResult {
  /** Temporary reference ID for the uploaded image. */
  imageRef: string;
  /** When this reference expires (ISO 8601). */
  expiresAt: string;
}

// ─── GET /v1/usage ───────────────────────────────────────────────────────────

export interface UsageResult {
  tenantId: string;
  period: string;
  tryOnCount: number;
  uploadCount: number;
}
