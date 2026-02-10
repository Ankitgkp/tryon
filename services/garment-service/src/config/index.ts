export interface GarmentServiceConfig {
  port: number;
  host: string;
  logLevel: string;
}

export function loadConfig(): GarmentServiceConfig {
  return {
    port: Number(process.env["PORT"] ?? 3003),
    host: process.env["HOST"] ?? "0.0.0.0",
    logLevel: process.env["LOG_LEVEL"] ?? "info",
  };
}
