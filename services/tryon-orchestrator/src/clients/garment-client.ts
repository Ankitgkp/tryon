import type { ApiResponse, Garment } from "@tryon/shared-types";

/**
 * Lightweight HTTP client for the Garment Service.
 * Used by the orchestrator to verify garment existence.
 */
export class GarmentClient {
  constructor(private readonly baseUrl: string) {}

  async getGarment(garmentId: string): Promise<Garment | undefined> {
    const url = `${this.baseUrl}/garment/${encodeURIComponent(garmentId)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.status === 404) return undefined;

    if (!res.ok) {
      throw new Error(
        `Garment service returned ${res.status}: ${await res.text()}`,
      );
    }

    const body = (await res.json()) as ApiResponse<Garment>;
    return body.data;
  }
}
