/**
 * Fastify application factory for the Tenant Service.
 *
 * Separated from the server bootstrap so the app can be
 * instantiated in tests without starting a real HTTP server.
 */

import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";

import type { TenantServiceConfig } from "./config/index.js";
import { InMemoryTenantStore, createDevTenant } from "./store/index.js";
import { validateKeyRoute, tenantRoute } from "./routes/index.js";

export async function buildApp(
  config: TenantServiceConfig
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      ...(config.env === "development" && {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
    },
    genReqId: () => crypto.randomUUID(),
  });

  // ── Security ────────────────────────────────────────────────────────────
  await app.register(cors, {
    // This is an internal service — restrict in production.
    origin: config.env === "production" ? false : true,
  });
  await app.register(helmet);

  // ── Tenant store ────────────────────────────────────────────────────────
  // In-memory for now. Swap with a DB-backed store in Phase 3+.
  const store = new InMemoryTenantStore();

  // Add a well-known dev key so developers don't need to copy from logs.
  if (config.env === "development") {
    const { tenant, plaintext } = createDevTenant();
    await store.create(tenant);
    app.log.info(`Dev API key: ${plaintext}`);
  }

  // ── Health check ────────────────────────────────────────────────────────
  app.get("/health", async () => ({ status: "ok" }));

  // ── Routes ──────────────────────────────────────────────────────────────
  // Routes receive the store via closure injection (no global state).
  await app.register(validateKeyRoute(store));
  await app.register(tenantRoute(store));

  return app;
}
