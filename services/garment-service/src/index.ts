import { buildApp } from "./app.js";
import { loadConfig } from "./config/index.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp();

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`Garment service listening on ${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err, "Failed to start garment service");
    process.exit(1);
  }
}

main();
