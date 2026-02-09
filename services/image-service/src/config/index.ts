/**
 * Image service configuration.
 */

export interface ImageServiceConfig {
  port: number;
  host: string;
  env: "development" | "staging" | "production";
  logLevel: string;
  /** Base URL for mock object storage (used to construct pre-signed URLs). */
  storageBaseUrl: string;
}

export function loadConfig(): ImageServiceConfig {
  return {
    port: parseInt(process.env["PORT"] ?? "3002", 10),
    host: process.env["HOST"] ?? "0.0.0.0",
    env: parseEnv(process.env["NODE_ENV"]),
    logLevel: process.env["LOG_LEVEL"] ?? "info",
    storageBaseUrl:
      process.env["STORAGE_BASE_URL"] ?? "http://localhost:3002/mock-storage",
  };
}

function parseEnv(
  value: string | undefined
): ImageServiceConfig["env"] {
  if (value === "production" || value === "staging") return value;
  return "development";
}
