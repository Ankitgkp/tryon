/**
 * Fastify application factory.
 *
 * Separated from the server bootstrap (index.ts) so the app can be
 * instantiated in tests without starting a real HTTP server.
 */

import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";

import type { GatewayConfig } from "./config/index.js";
import { requestLogger, apiKeyAuth, errorHandler } from "./middleware/index.js";
import { v1Routes } from "./routes/v1/index.js";

export async function buildApp(config: GatewayConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      // Structured JSON logging in production, pretty-print in dev.
      ...(config.env === "development" && {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
    },
    // Generate request IDs if not provided by the caller.
    genReqId: () => crypto.randomUUID(),
  });

  // ── Security ────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: config.env === "production" ? false : true, // Lock down in prod
  });
  await app.register(helmet);
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
      files: 1,
    },
  });

  // ── Global hooks ────────────────────────────────────────────────────────
  // Request logging runs first — assigns requestId.
  app.addHook("onRequest", requestLogger);

  // ── Error handler ───────────────────────────────────────────────────────
  app.setErrorHandler(errorHandler);

  // ── Health check (unauthenticated) ──────────────────────────────────────
  app.get("/health", async () => ({ status: "ok" }));

  // ── Authenticated v1 routes ─────────────────────────────────────────────
  // All /v1/* routes require a valid API key.
  await app.register(
    async (scoped) => {
      scoped.addHook("onRequest", apiKeyAuth);
      await scoped.register(v1Routes);
    },
    { prefix: "/v1" }
  );

  return app;
}
