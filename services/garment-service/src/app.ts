import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import type { ApiResponse } from "@tryon/shared-types";
import { InMemoryGarmentStore } from "./store/index.js";
import { createGarmentRoute } from "./routes/index.js";
import { loadConfig } from "./config/index.js";

export async function buildApp(): Promise<FastifyInstance> {
  const config = loadConfig();

  const app = Fastify({
    logger: {
      level: config.logLevel,
      ...(process.env["NODE_ENV"] !== "production" && {
        transport: { target: "pino-pretty" },
      }),
    },
  });

  // ── Plugins ──────────────────────────────────────────────────────────────
  await app.register(cors, { origin: true });
  await app.register(helmet, { global: true });

  // ── Health check (unauthenticated) ───────────────────────────────────────
  app.get("/health", async (_request, reply) => {
    const res: ApiResponse<{ status: string }> = {
      success: true,
      data: { status: "ok" },
    };
    return reply.send(res);
  });

  // ── Dependencies ─────────────────────────────────────────────────────────
  const garmentStore = new InMemoryGarmentStore();

  // ── Routes ───────────────────────────────────────────────────────────────
  await app.register(createGarmentRoute(garmentStore));

  return app;
}
