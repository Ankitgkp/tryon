/**
 * POST /v1/upload-image
 *
 * Accepts an image upload reference and returns a temporary image ref.
 * Stub only — returns a mock reference. No storage logic here.
 *
 * Future: streams upload to asset-service, returns signed ref with TTL.
 * Privacy note: images are temporary by default — refs expire.
 */

import type { FastifyInstance } from "fastify";
import type { ApiResponse, UploadImageResult } from "@tryon/shared-types";
import { randomUUID } from "node:crypto";

export async function uploadImageRoute(app: FastifyInstance): Promise<void> {
  app.post("/upload-image", async (request, reply) => {
    // TODO [Phase 2+]: Accept multipart upload, forward to asset-service.
    // For now, return a mock image reference.

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour TTL

    const result: UploadImageResult = {
      imageRef: `img_${randomUUID()}`,
      expiresAt: expiresAt.toISOString(),
    };

    const response: ApiResponse<UploadImageResult> = {
      success: true,
      data: result,
      meta: {
        requestId: request.requestId ?? "unknown",
        timestamp: new Date().toISOString(),
      },
    };

    return reply.status(201).send(response);
  });
}
