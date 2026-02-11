/**
 * POST /upload-url
 *
 * Generates a pre-signed upload URL for a user/garment image.
 *
 * Flow:
 * 1. Validate content type and file size against image policy
 * 2. Generate a unique image reference
 * 3. Compute TTL and expiry timestamps
 * 4. Create a pre-signed upload URL via the storage provider
 * 5. Save the image record for tracking
 * 6. Return the URL, ref, and expiry info to the caller
 *
 * PRIVACY: The image reference and storage key are opaque. The caller
 * cannot infer the storage path or access the object without a valid
 * pre-signed URL.
 */

import type { FastifyInstance } from "fastify";
import type {
  ApiResponse,
  UploadUrlRequest,
  UploadUrlResult,
  AllowedImageType,
  StoredImageRecord,
} from "@tryon/shared-types";
import type { ObjectStorageProvider } from "../storage/storage-provider.js";
import type { ImageRecordStore } from "../store/image-record-store.js";
import { validateUploadRequest, clampTtl } from "../services/image-validator.js";
import { randomUUID } from "node:crypto";

const UPLOAD_URL_TTL_SECONDS = 900;

interface RouteDeps {
  storage: ObjectStorageProvider;
  recordStore: ImageRecordStore;
}

export function uploadUrlRoute(deps: RouteDeps) {
  return async function (app: FastifyInstance): Promise<void> {
    app.post<{ Body: UploadUrlRequest }>("/upload-url", async (request, reply) => {
      const body = request.body ?? {};
      const { contentType, fileSizeBytes, purpose, ttlSeconds } = body;


      if (!contentType || !fileSizeBytes || !purpose) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "contentType, fileSizeBytes, and purpose are required.",
          },
        };
        return reply.status(400).send(response);
      }

 
      const violations = validateUploadRequest(contentType, fileSizeBytes);
      if (violations.length > 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "IMAGE_POLICY_VIOLATION",
            message: violations.join(" "),
            details: { violations },
          },
        };
        return reply.status(400).send(response);
      }

      const imageRef = `img_${randomUUID()}`;
      const storageKey = `${purpose}/${imageRef}`;
      const effectiveTtl = clampTtl(ttlSeconds);
      const imageExpiresAt = new Date(
        Date.now() + effectiveTtl * 1000
      ).toISOString();


      const presigned = await deps.storage.createPresignedUploadUrl({
        key: storageKey,
        contentType,
        fileSizeBytes,
        urlTtlSeconds: UPLOAD_URL_TTL_SECONDS,
        objectExpiresAt: imageExpiresAt,
      });


      const record: StoredImageRecord = {
        imageRef,
        tenantId: ((request as unknown as Record<string, unknown>)["tenantId"] as string) ?? "internal",
        storageKey,
        contentType: contentType as AllowedImageType,
        fileSizeBytes,
        purpose,
        uploaded: false,
        createdAt: new Date().toISOString(),
        expiresAt: imageExpiresAt,
      };
      await deps.recordStore.save(record);


      const result: UploadUrlResult = {
        uploadUrl: presigned.url,
        imageRef,
        method: "PUT",
        requiredHeaders: presigned.headers,
        uploadExpiresAt: presigned.expiresAt,
        imageExpiresAt,
      };

      const response: ApiResponse<UploadUrlResult> = {
        success: true,
        data: result,
      };
      return reply.status(201).send(response);
    });
  };
}
