/**
 * Fastify application factory for the Try-On Orchestrator.
 *
 * Wires together job store, service clients, and routes.
 * Intentionally vendor-agnostic — no AI provider code here.
 */

import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";

import type { ApiResponse } from "@tryon/shared-types";
import type { OrchestratorConfig } from "./config/index.js";
import { InMemoryJobStore } from "./store/index.js";
import { GarmentClient, ImageClient } from "./clients/index.js";
import { createTryOnRoute } from "./routes/index.js";

export async function buildApp(
  config: OrchestratorConfig,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      ...(config.env === "development" && {
        transport: { target: "pino-pretty", options: { colorize: true } },
      }),
    },
    genReqId: () => crypto.randomUUID(),
  });

  // ── Security ────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: config.env === "production" ? false : true,
  });
  await app.register(helmet);

  // ── Health check (unauthenticated) ──────────────────────────────────────
  app.get("/health", async (_request, reply) => {
    const res: ApiResponse<{ status: string }> = {
      success: true,
      data: { status: "ok" },
    };
    return reply.send(res);
  });

  // ── Dependencies ───────────────────────────────────────────────────────
  const jobStore = new InMemoryJobStore();
  const garmentClient = new GarmentClient(config.garmentServiceUrl);
  const imageClient = new ImageClient(config.imageServiceUrl);

  // ── Routes ─────────────────────────────────────────────────────────────
  await app.register(
    createTryOnRoute({ jobStore, garmentClient, imageClient }),
  );

  return app;
}
