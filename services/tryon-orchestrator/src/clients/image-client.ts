import type { ApiResponse, ValidateImageResult } from "@tryon/shared-types";

/**
 * Lightweight HTTP client for the Image Service.
 * Used by the orchestrator to validate user images exist and are usable.
 */
export class ImageClient {
  constructor(private readonly baseUrl: string) {}

  /**
   * Validate that an image reference exists and has been uploaded.
   * Note: We call validate-image with minimal dimensions (just existence check).
   */
  async validateImage(
    imageRef: string,
  ): Promise<{ valid: boolean; violations: string[] }> {
    const url = `${this.baseUrl}/validate-image`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageRef,
        widthPx: 256, // nominal — we just need to verify the image exists
        heightPx: 256,
      }),
    });

    if (!res.ok) {
      // 404 or 4xx means the image ref doesn't exist or is invalid
      if (res.status === 404) {
        return { valid: false, violations: ["Image reference not found"] };
      }
      throw new Error(
        `Image service returned ${res.status}: ${await res.text()}`,
      );
    }

    const body = (await res.json()) as ApiResponse<ValidateImageResult>;
    if (!body.data) {
      return { valid: false, violations: ["Image service returned no data"] };
    }
    return { valid: body.data.valid, violations: body.data.violations };
  }
}
