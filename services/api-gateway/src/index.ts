/**
 * API Gateway Service — Entry Point
 *
 * Bootstraps the Fastify server with all middleware and routes.
 * This file is the process entry point; app construction is in app.ts
 * so the server can be tested without binding to a port.
 */

import { loadConfig } from "./config/index.js";
import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp(config);

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(
      `API Gateway running on http://${config.host}:${config.port} [${config.env}]`
    );
  } catch (err) {
    app.log.fatal(err, "Failed to start API Gateway");
    process.exit(1);
  }
}

main();
