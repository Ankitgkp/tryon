/**
 * Image Service — Entry Point
 *
 * PRIVACY NOTICE:
 * This service handles user images. All images are temporary by default.
 * The expiry scheduler runs automatically and purges expired images.
 * There is no "permanent storage" code path. This is by design.
 */

import { loadConfig } from "./config/index.js";
import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp(config);

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(
      `Image Service running on http://${config.host}:${config.port} [${config.env}]`
    );
  } catch (err) {
    app.log.fatal(err, "Failed to start Image Service");
    process.exit(1);
  }
}

main();
