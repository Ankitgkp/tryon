/**
 * Image service type contracts.
 *
 * PRIVACY POLICY:
 * - All user images are temporary by default
 * - Every image reference has a TTL (time-to-live)
 * - No permanent storage path exists in the type system
 * - Expired images MUST be purged (enforced at the storage layer)
 */

// ─── Image Policy ────────────────────────────────────────────────────────────

/** Allowed MIME types for image uploads. */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/** Hard limits for image uploads. */
export const IMAGE_POLICY = {
  /** Maximum file size in bytes (10 MB). */
  maxFileSizeBytes: 10 * 1024 * 1024,
  /** Maximum image width in pixels. */
  maxWidthPx: 4096,
  /** Maximum image height in pixels. */
  maxHeightPx: 4096,
  /** Minimum image width in pixels. */
  minWidthPx: 128,
  /** Minimum image height in pixels. */
  minHeightPx: 128,
  /** Default TTL for uploaded images in seconds (1 hour). */
  defaultTtlSeconds: 3600,
  /** Maximum TTL a caller can request in seconds (24 hours). */
  maxTtlSeconds: 86400,
} as const;

// ─── POST /upload-url ────────────────────────────────────────────────────────

export interface UploadUrlRequest {
  /** MIME type of the image to upload. Must be in ALLOWED_IMAGE_TYPES. */
  contentType: AllowedImageType;
  /** File size in bytes. Used for pre-validation before upload. */
  fileSizeBytes: number;
  /** Purpose of the image — affects storage bucket and TTL. */
  purpose: ImagePurpose;
  /** Optional custom TTL in seconds. Capped at IMAGE_POLICY.maxTtlSeconds. */
  ttlSeconds?: number;
}

export interface UploadUrlResult {
  /** Pre-signed URL for the client to PUT the image to. */
  uploadUrl: string;
  /** Opaque reference ID for subsequent API calls. */
  imageRef: string;
  /** HTTP method to use for upload. */
  method: "PUT";
  /** Headers the client MUST include in the upload request. */
  requiredHeaders: Record<string, string>;
  /** When this upload URL expires (ISO 8601). */
  uploadExpiresAt: string;
  /** When the image itself will be purged (ISO 8601). */
  imageExpiresAt: string;
}

/** Why the image is being uploaded — determines storage rules. */
export type ImagePurpose = "user-photo" | "garment";

// ─── POST /validate-image ────────────────────────────────────────────────────

export interface ValidateImageRequest {
  /** The image reference returned from /upload-url. */
  imageRef: string;
  /** Reported image width in pixels (from client-side reading). */
  widthPx: number;
  /** Reported image height in pixels. */
  heightPx: number;
}

export interface ValidateImageResult {
  valid: boolean;
  imageRef: string;
  /** Reasons for rejection, if any. */
  violations: string[];
}

// ─── Internal storage record ─────────────────────────────────────────────────

export interface StoredImageRecord {
  /** Unique image reference ID. */
  imageRef: string;
  /** Tenant that owns this image. */
  tenantId: string;
  /** Storage key/path in the object store. */
  storageKey: string;
  /** MIME type. */
  contentType: AllowedImageType;
  /** File size in bytes. */
  fileSizeBytes: number;
  purpose: ImagePurpose;
  /** Whether the image has been uploaded (PUT completed). */
  uploaded: boolean;
  /** When this record was created (ISO 8601). */
  createdAt: string;
  /** When this image MUST be deleted (ISO 8601). */
  expiresAt: string;
}
