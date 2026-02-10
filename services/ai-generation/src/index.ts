/**
 * AI Generation Service — Entry Point
 *
 * This service abstracts AI image-generation providers behind a
 * vendor-agnostic interface. It receives GenerationRequests from the
 * Try-On Orchestrator and dispatches them to the appropriate provider.
 *
 * Currently supports:
 *   - OpenRouter (default, using bytedance-seed/seedream-4.5)
 *   - Mock provider (for development without an API key)
 *
 * To add a new provider, see:
 *   providers/ai-provider.ts   (interface)
 *   providers/                 (add your implementation)
 *   providers/model-registry.ts (map tiers to your models)
 */

import { loadConfig } from "./config/index.js";
import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp(config);

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(
      `AI Generation Service running on http://${config.host}:${config.port} [${config.env}] (provider: ${config.providerMode})`,
    );
  } catch (err) {
    app.log.fatal(err, "Failed to start AI Generation Service");
    process.exit(1);
  }
}

main();
