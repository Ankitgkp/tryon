import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import type { ApiResponse, CreateGarmentResult, Garment } from "@tryon/shared-types";
import type { GarmentStore } from "../store/index.js";
import { validateCreateGarmentRequest } from "../services/index.js";

export function createGarmentRoute(store: GarmentStore) {
  return async function garmentRoute(app: FastifyInstance): Promise<void> {
    // POST /garment — create a new garment
    app.post<{ Body: unknown }>("/garment", async (request, reply) => {
      const errors = validateCreateGarmentRequest(request.body);

      if (errors.length > 0) {
        const res: ApiResponse<null> = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid garment payload",
            details: { errors },
          },
        };
        return reply.status(400).send(res);
      }

      const body = request.body as Record<string, unknown>;
      const now = new Date().toISOString();
      const id = randomUUID();

      const garment: Garment = {
        id,
        tenantId: (request as unknown as Record<string, unknown>)["tenantId"] as string ?? "unknown",
        name: body["name"] as string,
        type: body["type"] as Garment["type"],
        category: body["category"] as Garment["category"],
        imageUrl: body["imageUrl"] as string,
        maskUrl: body["maskUrl"] as string | undefined,
        attributes: (body["attributes"] as Record<string, string>) ?? {},
        createdAt: now,
        updatedAt: now,
      };

      await store.create(garment);

      request.log.info({ garmentId: id }, "garment created");

      const res: ApiResponse<CreateGarmentResult> = {
        success: true,
        data: { id, garment },
      };

      return reply.status(201).send(res);
    });

    // GET /garment/:id — retrieve a garment by ID
    app.get<{ Params: { id: string } }>("/garment/:id", async (request, reply) => {
      const garment = await store.findById(request.params.id);

      if (!garment) {
        const res: ApiResponse<null> = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Garment ${request.params.id} not found`,
          },
        };
        return reply.status(404).send(res);
      }

      const res: ApiResponse<Garment> = {
        success: true,
        data: garment,
      };

      return reply.status(200).send(res);
    });
  };
}
