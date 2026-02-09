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

export interface TryOnRequest {
  /** URL or reference ID of the user's photo. */
  userImageRef: string;
  /** URL or reference ID of the garment image. */
  garmentImageRef: string;
  /** Optional parameters forwarded to the AI provider. */
  options?: Record<string, unknown>;
}

export interface TryOnResult {
  /** Job ID for async polling. */
  jobId: string;
  status: TryOnJobStatus;
}

export type TryOnJobStatus = "queued" | "processing" | "completed" | "failed";

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
