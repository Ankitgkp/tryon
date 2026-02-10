import type { FastifyInstance } from "fastify";
import type {
  ApiResponse,
  AIGenerateRequest,
  AIGenerateResult,
  ModelTier,
  GarmentType,
} from "@tryon/shared-types";
import type { ProviderRegistry } from "../providers/provider-registry.js";
import { generateImage } from "../services/index.js";
import { listModelMappings } from "../providers/model-registry.js";

interface GenerateRouteDeps {
  providerRegistry: ProviderRegistry;
  maxRetries: number;
  retryBaseDelayMs: number;
}

// Valid values for quick validation
const VALID_MODEL_TIERS = ["standard", "premium", "experimental"];
const VALID_GARMENT_TYPES = ["TOP", "BOTTOM", "DRESS", "OUTERWEAR", "ACCESSORY"];

export function createGenerateRoute(deps: GenerateRouteDeps) {
  return async function generateRoute(app: FastifyInstance): Promise<void> {
    // ── POST /generate — run AI image generation ──────────────────────────
    app.post<{ Body: unknown }>("/generate", async (request, reply) => {
      const body = request.body as Record<string, unknown> | null;

      if (!body || typeof body !== "object") {
        const res: ApiResponse<null> = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request body must be a JSON object",
          },
        };
        return reply.status(400).send(res);
      }

      // Validate required fields
      const errors: Array<{ field: string; message: string }> = [];

      if (typeof body["jobId"] !== "string" || !body["jobId"]) {
        errors.push({ field: "jobId", message: "jobId is required" });
      }
      if (typeof body["tenantId"] !== "string" || !body["tenantId"]) {
        errors.push({ field: "tenantId", message: "tenantId is required" });
      }
      if (
        typeof body["modelTier"] !== "string" ||
        !VALID_MODEL_TIERS.includes(body["modelTier"])
      ) {
        errors.push({
          field: "modelTier",
          message: `modelTier must be one of: ${VALID_MODEL_TIERS.join(", ")}`,
        });
      }
      if (
        typeof body["garmentType"] !== "string" ||
        !VALID_GARMENT_TYPES.includes(body["garmentType"])
      ) {
        errors.push({
          field: "garmentType",
          message: `garmentType must be one of: ${VALID_GARMENT_TYPES.join(", ")}`,
        });
      }
      if (typeof body["userImageUrl"] !== "string" || !body["userImageUrl"]) {
        errors.push({ field: "userImageUrl", message: "userImageUrl is required" });
      }
      if (typeof body["garmentImageUrl"] !== "string" || !body["garmentImageUrl"]) {
        errors.push({
          field: "garmentImageUrl",
          message: "garmentImageUrl is required",
        });
      }

      if (errors.length > 0) {
        const res: ApiResponse<null> = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid generation request",
            details: { errors },
          },
        };
        return reply.status(400).send(res);
      }

      const genRequest: AIGenerateRequest = {
        jobId: body["jobId"] as string,
        tenantId: body["tenantId"] as string,
        modelTier: body["modelTier"] as ModelTier,
        garmentType: body["garmentType"] as GarmentType,
        userImageUrl: body["userImageUrl"] as string,
        garmentImageUrl: body["garmentImageUrl"] as string,
        garmentMaskUrl: body["garmentMaskUrl"] as string | undefined,
        parameters: (body["parameters"] as Record<string, unknown>) ?? {},
      };

      try {
        const result = await generateImage(genRequest, {
          providerRegistry: deps.providerRegistry,
          maxRetries: deps.maxRetries,
          retryBaseDelayMs: deps.retryBaseDelayMs,
          log: (msg, data) => request.log.info(data ?? {}, msg),
        });

        const res: ApiResponse<AIGenerateResult> = {
          success: true,
          data: result,
        };

        return reply.status(200).send(res);
      } catch (err) {
        const error = err as { name?: string; message?: string; statusCode?: number };

        if (error.name === "PermanentProviderError") {
          const res: ApiResponse<null> = {
            success: false,
            error: {
              code: "GENERATION_FAILED",
              message: error.message ?? "Permanent generation failure",
            },
          };
          return reply.status(422).send(res);
        }

        request.log.error({ err }, "Generation failed after retries");

        const res: ApiResponse<null> = {
          success: false,
          error: {
            code: "GENERATION_ERROR",
            message: "Image generation failed after retries",
          },
        };
        return reply.status(502).send(res);
      }
    });

    // ── GET /models — list available model mappings ───────────────────────
    app.get("/models", async (_request, reply) => {
      const res: ApiResponse<Record<string, unknown>> = {
        success: true,
        data: {
          models: listModelMappings(),
          providers: deps.providerRegistry.listIds(),
        },
      };
      return reply.status(200).send(res);
    });
  };
}
