/**
 * POST /validate-image
 *
 * Validates an uploaded image's metadata (dimensions) against the image policy.
 * Must be called after the image has been uploaded via the pre-signed URL.
 *
 * Flow:
 * 1. Look up the image record by ref
 * 2. Verify the image has been uploaded
 * 3. Validate reported dimensions against policy
 * 4. Return validation result
 *
 * NOTE: Currently trusts client-reported dimensions. In a future phase,
 * the service should read dimensions from the actual uploaded file headers
 * (e.g., via sharp or the storage provider's metadata API).
 */

import type { FastifyInstance } from "fastify";
import type {
  ApiResponse,
  ValidateImageRequest,
  ValidateImageResult,
} from "@tryon/shared-types";
import type { ImageRecordStore } from "../store/image-record-store.js";
import { validateImageDimensions } from "../services/image-validator.js";

interface RouteDeps {
  recordStore: ImageRecordStore;
}

export function validateImageRoute(deps: RouteDeps) {
  return async function (app: FastifyInstance): Promise<void> {
    app.post<{ Body: ValidateImageRequest }>(
      "/validate-image",
      async (request, reply) => {
        const body = request.body ?? {};
        const { imageRef, widthPx, heightPx } = body;

        // ── Input presence check ────────────────────────────────────────
        if (!imageRef || widthPx === undefined || heightPx === undefined) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: "INVALID_INPUT",
              message: "imageRef, widthPx, and heightPx are required.",
            },
          };
          return reply.status(400).send(response);
        }

        // ── Look up record ──────────────────────────────────────────────
        const record = await deps.recordStore.findByRef(imageRef);
        if (!record) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: "IMAGE_NOT_FOUND",
              message: "Image reference not found or has expired.",
            },
          };
          return reply.status(404).send(response);
        }

        // ── Check upload status ─────────────────────────────────────────
        // In mock mode we auto-mark as uploaded for convenience.
        // In production, the storage provider would confirm via webhook/poll.
        if (!record.uploaded) {
          await deps.recordStore.markUploaded(imageRef);
        }

        // ── Validate dimensions ─────────────────────────────────────────
        const violations = validateImageDimensions(widthPx, heightPx);

        const result: ValidateImageResult = {
          valid: violations.length === 0,
          imageRef,
          violations,
        };

        const response: ApiResponse<ValidateImageResult> = {
          success: true,
          data: result,
        };
        return reply.status(200).send(response);
      }
    );
  };
}
