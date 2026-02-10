/**
 * AI Generation Service configuration.
 */

export interface AIGenerationConfig {
  port: number;
  host: string;
  env: "development" | "staging" | "production";
  logLevel: string;
  /** OpenRouter API key. Required when providerMode is "openrouter". */
  openRouterApiKey: string;
  /** "mock" uses the mock provider (no API key). "openrouter" uses real API. */
  providerMode: "mock" | "openrouter";
  /** Maximum retries for transient provider failures. */
  maxRetries: number;
  /** Base delay between retries in ms (exponential backoff). */
  retryBaseDelayMs: number;
}

function parseEnv(value: string | undefined): AIGenerationConfig["env"] {
  if (value === "production" || value === "staging") return value;
  return "development";
}

function parseProviderMode(
  value: string | undefined,
): AIGenerationConfig["providerMode"] {
  if (value === "openrouter") return "openrouter";
  return "mock";
}

export function loadConfig(): AIGenerationConfig {
  return {
    port: parseInt(process.env["PORT"] ?? "3005", 10),
    host: process.env["HOST"] ?? "0.0.0.0",
    env: parseEnv(process.env["NODE_ENV"]),
    logLevel: process.env["LOG_LEVEL"] ?? "info",
    openRouterApiKey: process.env["OPENROUTER_API_KEY"] ?? "",
    providerMode: parseProviderMode(process.env["AI_PROVIDER_MODE"]),
    maxRetries: parseInt(process.env["MAX_RETRIES"] ?? "3", 10),
    retryBaseDelayMs: parseInt(process.env["RETRY_BASE_DELAY_MS"] ?? "1000", 10),
  };
}
