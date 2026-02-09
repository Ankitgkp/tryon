/**
 * GET /v1/usage
 *
 * Returns usage statistics for the authenticated tenant.
 * Stub only — returns mock data.
 *
 * Future: queries usage-tracking service or reads from a billing database.
 */

import type { FastifyInstance } from "fastify";
import type { ApiResponse, UsageResult } from "@tryon/shared-types";

export async function usageRoute(app: FastifyInstance): Promise<void> {
  app.get("/usage", async (request, reply) => {
    // TODO [Phase 2+]: Query real usage data from a downstream service.

    const result: UsageResult = {
      tenantId: request.tenantId ?? "unknown",
      period: new Date().toISOString().slice(0, 7), // e.g. "2026-02"
      tryOnCount: 0,
      uploadCount: 0,
    };

    const response: ApiResponse<UsageResult> = {
      success: true,
      data: result,
      meta: {
        requestId: request.requestId ?? "unknown",
        timestamp: new Date().toISOString(),
      },
    };

    return reply.status(200).send(response);
  });
}
