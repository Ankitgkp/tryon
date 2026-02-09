/**
 * Service configuration.
 * Reads from environment variables with sensible defaults for local dev.
 * No .env file parsing here — that's the responsibility of the deployment layer.
 */

export interface GatewayConfig {
  /** Port the HTTP server listens on. */
  port: number;
  /** Host to bind to. */
  host: string;
  /** Current environment name. */
  env: "development" | "staging" | "production";
  /** Log level for pino. */
  logLevel: string;
}

export function loadConfig(): GatewayConfig {
  return {
    port: parseInt(process.env["PORT"] ?? "3000", 10),
    host: process.env["HOST"] ?? "0.0.0.0",
    env: parseEnv(process.env["NODE_ENV"]),
    logLevel: process.env["LOG_LEVEL"] ?? "info",
  };
}

function parseEnv(
  value: string | undefined
): GatewayConfig["env"] {
  if (value === "production" || value === "staging") return value;
  return "development";
}
