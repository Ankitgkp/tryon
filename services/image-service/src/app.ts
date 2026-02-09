/**
 * Fastify application factory for the Image Service.
 *
 * Wires together storage, record store, cleanup scheduler, and routes.
 */

import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";

import type { ImageServiceConfig } from "./config/index.js";
import { MockStorageProvider } from "./storage/index.js";
import { InMemoryImageRecordStore } from "./store/index.js";
import { ExpiryScheduler } from "./services/index.js";
import { uploadUrlRoute, validateImageRoute } from "./routes/index.js";

export async function buildApp(
  config: ImageServiceConfig
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
    origin: config.env === "production" ? false : true,
  });
  await app.register(helmet);

  // ── Storage & record store ──────────────────────────────────────────────
  // Mock implementations for now. Swap with real S3 + DB in production.
  const storage = new MockStorageProvider(config.storageBaseUrl);
  const recordStore = new InMemoryImageRecordStore();

  // ── Expiry cleanup scheduler ────────────────────────────────────────────
  // Runs every 60s in development, configurable in production.
  const scheduler = new ExpiryScheduler({
    store: recordStore,
    storage,
    intervalMs: config.env === "development" ? 60_000 : 30_000,
    log: (msg) => app.log.info(msg),
  });
  scheduler.start();

  // Graceful shutdown: stop scheduler when server closes
  app.addHook("onClose", async () => {
    scheduler.stop();
  });

  // ── Health check ────────────────────────────────────────────────────────
  app.get("/health", async () => ({
    status: "ok",
    trackedImages: recordStore.recordCount(),
    storageObjects: storage.objectCount(),
  }));

  // ── Routes ──────────────────────────────────────────────────────────────
  const deps = { storage, recordStore };
  await app.register(uploadUrlRoute(deps));
  await app.register(validateImageRoute(deps));

  return app;
}
