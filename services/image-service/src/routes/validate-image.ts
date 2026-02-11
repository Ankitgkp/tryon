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


        if (!record.uploaded) {
          await deps.recordStore.markUploaded(imageRef);
        }

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
