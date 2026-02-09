/**
 * Tenant service configuration.
 * Reads from environment variables with sensible defaults for local dev.
 */

export interface TenantServiceConfig {
  port: number;
  host: string;
  env: "development" | "staging" | "production";
  logLevel: string;
}

export function loadConfig(): TenantServiceConfig {
  return {
    port: parseInt(process.env["PORT"] ?? "3001", 10),
    host: process.env["HOST"] ?? "0.0.0.0",
    env: parseEnv(process.env["NODE_ENV"]),
    logLevel: process.env["LOG_LEVEL"] ?? "info",
  };
}

function parseEnv(
  value: string | undefined
): TenantServiceConfig["env"] {
  if (value === "production" || value === "staging") return value;
  return "development";
}
