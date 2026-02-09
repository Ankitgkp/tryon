/**
 * Tenant Service — Entry Point
 *
 * Bootstraps the Fastify server for tenant management and API key validation.
 */

import { loadConfig } from "./config/index.js";
import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp(config);

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(
      `Tenant Service running on http://${config.host}:${config.port} [${config.env}]`
    );
  } catch (err) {
    app.log.fatal(err, "Failed to start Tenant Service");
    process.exit(1);
  }
}

main();
