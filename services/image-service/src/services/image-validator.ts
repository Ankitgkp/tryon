/**
 * Image Validation Service
 *
 * Centralizes all image policy checks. Every validation function
 * returns a list of human-readable violation strings (empty = valid).
 *
 * Two validation stages:
 * 1. Pre-upload: validate content type and file size before generating a URL
 * 2. Post-upload: validate reported dimensions before processing
 */

import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_POLICY,
  type AllowedImageType,
} from "@tryon/shared-types";

/**
 * Validates content type and file size before generating an upload URL.
 */
export function validateUploadRequest(
  contentType: string,
  fileSizeBytes: number
): string[] {
  const violations: string[] = [];

  if (!ALLOWED_IMAGE_TYPES.includes(contentType as AllowedImageType)) {
    violations.push(
      `Unsupported content type "${contentType}". Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}.`
    );
  }

  if (fileSizeBytes <= 0) {
    violations.push("File size must be greater than 0 bytes.");
  }

  if (fileSizeBytes > IMAGE_POLICY.maxFileSizeBytes) {
    const maxMb = IMAGE_POLICY.maxFileSizeBytes / (1024 * 1024);
    violations.push(`File size exceeds maximum of ${maxMb} MB.`);
  }

  return violations;
}

/**
 * Validates image dimensions after upload (reported by the client).
 * In a future phase, the service could read actual dimensions from
 * the uploaded file header — for now we trust client-reported values.
 */
export function validateImageDimensions(
  widthPx: number,
  heightPx: number
): string[] {
  const violations: string[] = [];

  if (!Number.isInteger(widthPx) || !Number.isInteger(heightPx)) {
    violations.push("Image dimensions must be integers.");
    return violations; // Can't check further with non-integer values
  }

  if (widthPx < IMAGE_POLICY.minWidthPx || heightPx < IMAGE_POLICY.minHeightPx) {
    violations.push(
      `Image is too small. Minimum: ${IMAGE_POLICY.minWidthPx}×${IMAGE_POLICY.minHeightPx}px.`
    );
  }

  if (widthPx > IMAGE_POLICY.maxWidthPx || heightPx > IMAGE_POLICY.maxHeightPx) {
    violations.push(
      `Image is too large. Maximum: ${IMAGE_POLICY.maxWidthPx}×${IMAGE_POLICY.maxHeightPx}px.`
    );
  }

  return violations;
}

/**
 * Clamps a requested TTL to the allowed range.
 */
export function clampTtl(requestedSeconds?: number): number {
  if (requestedSeconds === undefined || requestedSeconds <= 0) {
    return IMAGE_POLICY.defaultTtlSeconds;
  }
  return Math.min(requestedSeconds, IMAGE_POLICY.maxTtlSeconds);
}
