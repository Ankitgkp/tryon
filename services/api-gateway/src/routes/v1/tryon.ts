/**
 * POST /v1/tryon
 *
 * Accepts a user image + garment image and queues a virtual try-on job.
 * Stub only — returns a mock job ID. No AI logic here.
 *
 * Future: validates input, forwards to try-on-service, returns job handle.
 */

import type { FastifyInstance } from "fastify";
import type { ApiResponse, TryOnRequest, TryOnResult } from "@tryon/shared-types";
import { randomUUID } from "node:crypto";

export async function tryonRoute(app: FastifyInstance): Promise<void> {
  app.post<{ Body: TryOnRequest }>("/tryon", async (request, reply) => {
    const { userImageRef, garmentImageRef } = request.body ?? {};

    // Basic input presence check (proper validation deferred to Phase 2+).
    if (!userImageRef || !garmentImageRef) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Both userImageRef and garmentImageRef are required.",
        },
        meta: {
          requestId: request.requestId ?? "unknown",
          timestamp: new Date().toISOString(),
        },
      };
      return reply.status(400).send(response);
    }

    // TODO [Phase 2+]: Forward to try-on-service for actual processing.
    const result: TryOnResult = {
      jobId: randomUUID(),
      status: "queued",
    };

    const response: ApiResponse<TryOnResult> = {
      success: true,
      data: result,
      meta: {
        requestId: request.requestId ?? "unknown",
        timestamp: new Date().toISOString(),
      },
    };

    return reply.status(202).send(response);
  });
}
