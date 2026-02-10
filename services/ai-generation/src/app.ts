/**
 * Fastify application factory for the AI Generation Service.
 *
 * Wires together provider registry, model registry, and routes.
 * AI provider logic is fully isolated — no tenant or job state here.
 */

import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";

import type { ApiResponse } from "@tryon/shared-types";
import type { AIGenerationConfig } from "./config/index.js";
import {
  ProviderRegistry,
  OpenRouterProvider,
  MockProvider,
} from "./providers/index.js";
import { createGenerateRoute } from "./routes/index.js";

export async function buildApp(
  config: AIGenerationConfig,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      ...(config.env === "development" && {
        transport: { target: "pino-pretty", options: { colorize: true } },
      }),
    },
    genReqId: () => crypto.randomUUID(),
    bodyLimit: 10 * 1024 * 1024, // 10 MB — requests carry base64 images
  });

  // ── Security ────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: config.env === "production" ? false : true,
  });
  await app.register(helmet);

  // ── Provider Registry ──────────────────────────────────────────────────
  const providerRegistry = new ProviderRegistry();

  if (config.providerMode === "openrouter") {
    providerRegistry.register(new OpenRouterProvider(config.openRouterApiKey));
    app.log.info("Registered OpenRouter provider (live mode)");
  } else {
    // Mock mode — register mock as both "mock" and "openrouter" so model
    // registry mappings work without changes
    const mock = new MockProvider(500);
    providerRegistry.register(mock);
    // Also register under "openrouter" alias so tier→model resolution works
    const mockAsOpenRouter: typeof mock & { id: string } = Object.create(mock);
    Object.defineProperty(mockAsOpenRouter, "id", { value: "openrouter" });
    providerRegistry.register(mockAsOpenRouter);
    app.log.info("Registered Mock provider (development mode)");
  }

  // ── Health check ────────────────────────────────────────────────────────
  app.get("/health", async (_request, reply) => {
    const res: ApiResponse<{ status: string; providerMode: string; providers: string[] }> = {
      success: true,
      data: {
        status: "ok",
        providerMode: config.providerMode,
        providers: providerRegistry.listIds(),
      },
    };
    return reply.send(res);
  });

  // ── Routes ─────────────────────────────────────────────────────────────
  await app.register(
    createGenerateRoute({
      providerRegistry,
      maxRetries: config.maxRetries,
      retryBaseDelayMs: config.retryBaseDelayMs,
    }),
  );

  return app;
}
