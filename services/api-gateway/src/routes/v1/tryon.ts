/**
 * POST /v1/tryon
 *
 * Accepts a user image + garment ID and queues a virtual try-on job.
 * Stub only — returns a mock job ID. No AI logic here.
 *
 * Future: validates input, forwards to tryon-orchestrator, returns job handle.
 */

import type { FastifyInstance } from "fastify";
import type { ApiResponse, CreateTryOnRequest, CreateTryOnResult } from "@tryon/shared-types";
import { randomUUID } from "node:crypto";

export async function tryonRoute(app: FastifyInstance): Promise<void> {
  app.post<{ Body: CreateTryOnRequest }>("/tryon", async (request, reply) => {
    const { userImageRef, garmentId } = request.body ?? {};

    // Basic input presence check (proper validation in orchestrator).
    if (!userImageRef || !garmentId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Both userImageRef and garmentId are required.",
        },
        meta: {
          requestId: request.requestId ?? "unknown",
          timestamp: new Date().toISOString(),
        },
      };
      return reply.status(400).send(response);
    }

    // TODO [Phase 5+]: Forward to tryon-orchestrator for actual processing.
    const now = new Date().toISOString();
    const result: CreateTryOnResult = {
      jobId: randomUUID(),
      status: "queued",
      createdAt: now,
    };

    const response: ApiResponse<CreateTryOnResult> = {
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
