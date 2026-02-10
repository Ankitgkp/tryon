/**
 * Try-On Orchestrator — Entry Point
 *
 * This service coordinates the virtual try-on pipeline.
 * It validates inputs against image-service and garment-service,
 * selects a model tier, builds a generation request, and tracks job state.
 *
 * It NEVER calls an AI provider directly — that responsibility belongs
 * to the AI Generation Service (Phase 6).
 */

import { loadConfig } from "./config/index.js";
import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp(config);

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(
      `Try-On Orchestrator running on http://${config.host}:${config.port} [${config.env}]`,
    );
  } catch (err) {
    app.log.fatal(err, "Failed to start Try-On Orchestrator");
    process.exit(1);
  }
}

main();
