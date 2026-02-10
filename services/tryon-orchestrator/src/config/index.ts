/**
 * Try-On Orchestrator configuration.
 */

export interface OrchestratorConfig {
  port: number;
  host: string;
  env: "development" | "staging" | "production";
  logLevel: string;
  /** Internal URL of the Image Service (for validating user images). */
  imageServiceUrl: string;
  /** Internal URL of the Garment Service (for fetching garment data). */
  garmentServiceUrl: string;
}

function parseEnv(
  value: string | undefined,
): OrchestratorConfig["env"] {
  if (value === "production" || value === "staging") return value;
  return "development";
}

export function loadConfig(): OrchestratorConfig {
  return {
    port: parseInt(process.env["PORT"] ?? "3004", 10),
    host: process.env["HOST"] ?? "0.0.0.0",
    env: parseEnv(process.env["NODE_ENV"]),
    logLevel: process.env["LOG_LEVEL"] ?? "info",
    imageServiceUrl:
      process.env["IMAGE_SERVICE_URL"] ?? "http://localhost:3002",
    garmentServiceUrl:
      process.env["GARMENT_SERVICE_URL"] ?? "http://localhost:3003",
  };
}
