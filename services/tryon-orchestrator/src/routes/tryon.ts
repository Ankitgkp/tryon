import type { FastifyInstance } from "fastify";
import type {
  ApiResponse,
  CreateTryOnRequest,
  CreateTryOnResult,
  TryOnJob,
  TenantPlan,
} from "@tryon/shared-types";
import type { JobStore } from "../store/index.js";
import type { GarmentClient } from "../clients/garment-client.js";
import type { ImageClient } from "../clients/image-client.js";
import {
  validateCreateTryOnRequest,
  orchestrateTryOn,
} from "../services/index.js";

interface TryOnRouteDeps {
  jobStore: JobStore;
  garmentClient: GarmentClient;
  imageClient: ImageClient;
}

export function createTryOnRoute(deps: TryOnRouteDeps) {
  return async function tryOnRoute(app: FastifyInstance): Promise<void> {
    // ── POST /tryon — create a new try-on job ─────────────────────────────
    app.post<{ Body: unknown }>("/tryon", async (request, reply) => {
      // 1. Shape validation
      const errors = validateCreateTryOnRequest(request.body);
      if (errors.length > 0) {
        const res: ApiResponse<null> = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid try-on request",
            details: { errors },
          },
        };
        return reply.status(400).send(res);
      }

      const body = request.body as CreateTryOnRequest;
      const tenantId =
        (request as unknown as Record<string, unknown>)["tenantId"] as string ??
        "unknown";
      const tenantPlan =
        ((request as unknown as Record<string, unknown>)["tenantPlan"] as TenantPlan) ??
        "free";

      // 2. Orchestrate
      const result = await orchestrateTryOn(body, tenantId, tenantPlan, {
        jobStore: deps.jobStore,
        garmentClient: deps.garmentClient,
        imageClient: deps.imageClient,
        log: (msg, data) => request.log.info(data ?? {}, msg),
      });

      if (!result.success) {
        const err = result as import("../services/index.js").OrchestrateError;
        const res: ApiResponse<null> = {
          success: false,
          error: { code: err.code, message: err.message },
        };
        const statusCode = err.code.endsWith("NOT_FOUND") ? 404 : 502;
        return reply.status(statusCode).send(res);
      }

      // 3. In a real system, we would now dispatch result.generationRequest
      //    to the AI Generation Service (Phase 6). For now, log it.
      request.log.info(
        { jobId: result.job.id, modelTier: result.job.modelTier },
        "Generation request built (dispatch deferred to Phase 6)",
      );

      const res: ApiResponse<CreateTryOnResult> = {
        success: true,
        data: {
          jobId: result.job.id,
          status: result.job.status,
          createdAt: result.job.createdAt,
        },
      };

      return reply.status(202).send(res);
    });

    // ── GET /tryon/:jobId — poll job status ───────────────────────────────
    app.get<{ Params: { jobId: string } }>(
      "/tryon/:jobId",
      async (request, reply) => {
        const job = await deps.jobStore.findById(request.params.jobId);

        if (!job) {
          const res: ApiResponse<null> = {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: `Job ${request.params.jobId} not found`,
            },
          };
          return reply.status(404).send(res);
        }

        const res: ApiResponse<TryOnJob> = {
          success: true,
          data: job,
        };

        return reply.status(200).send(res);
      },
    );
  };
}
