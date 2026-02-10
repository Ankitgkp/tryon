import { OpenRouter } from "@openrouter/sdk";
import type {
  ProviderGenerateRequest,
  ProviderGenerateResult,
} from "@tryon/shared-types";
import type { AIProvider } from "./ai-provider.js";
import {
  TransientProviderError,
  PermanentProviderError,
} from "./ai-provider.js";

/**
 * OpenRouter AI provider.
 *
 * Uses the official @openrouter/sdk to call image-generation models
 * via the chat.send() API with modalities: ["image"].
 *
 * The prompt is constructed to instruct the model to perform a virtual
 * try-on: place the garment onto the user in the photo.
 */
export class OpenRouterProvider implements AIProvider {
  readonly id = "openrouter";
  readonly displayName = "OpenRouter";

  private readonly client: OpenRouter;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new PermanentProviderError(
        "OpenRouter API key is required. Set OPENROUTER_API_KEY env var.",
      );
    }
    this.client = new OpenRouter({ apiKey });
  }

  async generate(
    request: ProviderGenerateRequest,
  ): Promise<ProviderGenerateResult> {
    const startTime = Date.now();

    try {
      const result = await this.client.chat.send({
        chatGenerationParams: {
          model: request.model.modelId,
          messages: [
            {
              role: "user" as const,
              content: [
                {
                  type: "text" as const,
                  text: request.prompt,
                },
                {
                  type: "text" as const,
                  text: "\n\n[CUSTOMER PHOTO — this is the person to dress:]",
                },
                {
                  type: "image_url" as const,
                  imageUrl: { url: request.userImageUrl },
                },
                {
                  type: "text" as const,
                  text: "\n\n[EXACT PRODUCT IMAGE — reproduce this garment with 100% fidelity, do NOT change any detail:]",
                },
                {
                  type: "image_url" as const,
                  imageUrl: { url: request.garmentImageUrl },
                },
                // Include mask if available
                ...(request.garmentMaskUrl
                  ? [
                      {
                        type: "text" as const,
                        text: "\n\n[GARMENT MASK:]",
                      },
                      {
                        type: "image_url" as const,
                        imageUrl: { url: request.garmentMaskUrl },
                      },
                    ]
                  : []),
                {
                  type: "text" as const,
                  text:
                    "\n\nREMINDER: The garment in the output MUST be visually identical to the product image above. " +
                    "Same exact colors, same exact pattern, same exact design. " +
                    "Generate a single photorealistic image of the customer wearing this exact product.",
                },
              ],
            },
          ],
          // Sourceful Riverflow models are image-only generators — use ["image"]
          modalities: ["image"],
          stream: false,
        },
      });

      const processingTimeMs = Date.now() - startTime;

      // Extract generated image from response.
      // With stream: false the SDK returns a ChatResponse (not an EventStream).
      // We cast to access the typed choices array.
      const chatResponse = result as {
        choices: Array<{
          message: {
            images?: Array<{
              image_url?: { url: string };
              imageUrl?: { url: string };
            }>;
          };
        }>;
      };

      const message = chatResponse.choices?.[0]?.message;
      if (!message) {
        throw new TransientProviderError(
          "OpenRouter returned no choices in response",
        );
      }

      // images array may use snake_case (image_url) or camelCase (imageUrl)
      const images = message.images;

      if (!images || images.length === 0) {
        throw new TransientProviderError(
          "OpenRouter returned no images in response. " +
            "Ensure the model supports image output modalities.",
        );
      }

      const firstImage = images[0];
      if (!firstImage) {
        throw new TransientProviderError(
          "OpenRouter returned empty image entry in response.",
        );
      }

      const imageUrl =
        firstImage.image_url?.url ?? firstImage.imageUrl?.url ?? "";

      if (!imageUrl) {
        throw new TransientProviderError(
          "OpenRouter returned image entry without URL",
        );
      }

      return {
        imageUrl,
        processingTimeMs,
        modelId: request.model.modelId,
      };
    } catch (err) {
      if (
        err instanceof TransientProviderError ||
        err instanceof PermanentProviderError
      ) {
        throw err;
      }

      // Classify HTTP errors — try direct properties first, then parse from message
      const error = err as { statusCode?: number; status?: number; message?: string; code?: number };
      let status = error.statusCode ?? error.status ?? error.code;

      // OpenRouter SDK wraps errors as "Status 402\nBody: {...}" — extract status
      if (!status && error.message) {
        const match = error.message.match(/Status (\d{3})/);
        if (match?.[1]) status = parseInt(match[1], 10);
      }
      if (!status) {
        const errStr = String(err);
        const match = errStr.match(/Status (\d{3})/);
        if (match?.[1]) status = parseInt(match[1], 10);
      }

      if (status === 401 || status === 402 || status === 403) {
        throw new PermanentProviderError(
          `OpenRouter authentication/billing failed (${status}): ${error.message ?? "Invalid API key or insufficient credits"}`,
          status,
        );
      }

      if (status === 400 || status === 404) {
        throw new PermanentProviderError(
          `OpenRouter request error (${status}): ${error.message ?? "Bad request"}`,
          status,
        );
      }

      if (status === 429 || (status && status >= 500)) {
        throw new TransientProviderError(
          `OpenRouter server error (${status}): ${error.message ?? "Transient failure"}`,
          status,
        );
      }

      // Unknown errors default to transient (worth retrying)
      throw new TransientProviderError(
        `OpenRouter unexpected error: ${String(err)}`,
      );
    }
  }
}
