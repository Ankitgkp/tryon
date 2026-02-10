/**
 * TryOn API Client.
 *
 * Communicates exclusively with the API Gateway.
 * The SDK never talks to internal services directly.
 */

import type { TryOnResult, GarmentInput } from "./types";

const DEFAULT_BASE_URL = "https://api.tryon.dev/v1";
const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_ATTEMPTS = 90; // 3 minutes at 2s intervals

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

interface UploadImageResponse {
  imageRef: string;
  expiresAt: string;
}

interface CreateTryOnResponse {
  jobId: string;
  status: string;
  createdAt: string;
}

interface TryOnJobResponse {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  result?: {
    resultImageUrl: string;
    processingTimeMs: number;
    modelId: string;
  };
  failureReason?: string;
}

export class TryOnApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  /** Upload a user image and get a temporary reference. */
  async uploadImage(file: File): Promise<string> {
    // For now the gateway expects a POST; we send the file as form data.
    // When the gateway supports multipart, switch to that.
    // Current stub just returns a mock ref — matches the gateway behavior.
    const formData = new FormData();
    formData.append("image", file);

    const res = await this.fetch<UploadImageResponse>("/upload-image", {
      method: "POST",
      body: formData,
      // Don't set Content-Type — browser sets it with boundary for FormData
      rawBody: true,
    });

    return res.imageRef;
  }

  /** Create a try-on job. */
  async createTryOn(
    userImageRef: string,
    garment: GarmentInput,
  ): Promise<string> {
    const body: Record<string, unknown> = { userImageRef };

    if ("garmentId" in garment) {
      body.garmentId = garment.garmentId;
    } else {
      // If passing a raw image URL, the gateway needs both
      body.garmentImageUrl = garment.imageUrl;
      body.garmentType = garment.type;
    }

    const res = await this.fetch<CreateTryOnResponse>("/tryon", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return res.jobId;
  }

  /** Poll a try-on job until it reaches a terminal state. */
  async pollJob(
    jobId: string,
    onProgress?: (status: string) => void,
  ): Promise<TryOnResult> {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const job = await this.fetch<TryOnJobResponse>(`/tryon/${jobId}`, {
        method: "GET",
      });

      onProgress?.(job.status);

      if (job.status === "completed" && job.result) {
        return {
          imageUrl: job.result.resultImageUrl,
          jobId,
          processingTimeMs: job.result.processingTimeMs,
        };
      }

      if (job.status === "failed") {
        throw new TryOnApiError(
          "GENERATION_FAILED",
          job.failureReason ?? "Image generation failed. Please try again.",
        );
      }

      // Wait before next poll
      await sleep(POLL_INTERVAL_MS);
    }

    throw new TryOnApiError(
      "TIMEOUT",
      "Image generation timed out. Please try again.",
    );
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private async fetch<T>(
    path: string,
    options: {
      method: string;
      body?: string | FormData;
      rawBody?: boolean;
    },
  ): Promise<T> {
    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
    };

    if (!options.rawBody && options.body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await globalThis.fetch(`${this.baseUrl}${path}`, {
      method: options.method,
      headers,
      body: options.body,
    });

    const json = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !json.success) {
      throw new TryOnApiError(
        json.error?.code ?? "API_ERROR",
        json.error?.message ?? `Request failed with status ${response.status}`,
      );
    }

    if (!json.data) {
      throw new TryOnApiError("EMPTY_RESPONSE", "Server returned no data.");
    }

    return json.data;
  }
}

export class TryOnApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "TryOnApiError";
    this.code = code;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
