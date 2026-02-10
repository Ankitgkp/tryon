/**
 * POST /v1/upload-image
 *
 * Accepts an image upload, resizes it to a reasonable size for AI processing,
 * and stores it in-memory as a base64 data URL.
 * Returns a temporary image ref that can be used in subsequent try-on requests.
 * Images are evicted after 1 hour.
 */

import type { FastifyInstance } from "fastify";
import type { ApiResponse, UploadImageResult } from "@tryon/shared-types";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

/** Max dimension (width or height) for the resized image sent to AI. */
const MAX_DIMENSION = 1024;
/** JPEG quality for compressed output (0-100). */
const JPEG_QUALITY = 80;

/**
 * In-memory image store: imageRef → base64 data URL.
 * Exported so the tryon route can read uploaded images.
 */
export const uploadedImages = new Map<string, { dataUrl: string; expiresAt: number }>();

// Evict expired images every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of uploadedImages) {
    if (entry.expiresAt < now) uploadedImages.delete(key);
  }
}, 60_000);

export async function uploadImageRoute(app: FastifyInstance): Promise<void> {
  app.post("/upload-image", async (request, reply) => {
    const file = await request.file();

    if (!file) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: "MISSING_FILE",
          message: "An image file is required. Send as multipart/form-data with field name \"image\".",
        },
        meta: {
          requestId: request.requestId ?? "unknown",
          timestamp: new Date().toISOString(),
        },
      };
      return reply.status(400).send(errorResponse);
    }

    // Read file into memory
    const rawBuffer = await file.toBuffer();
    const originalSizeKB = Math.round(rawBuffer.length / 1024);

    // Resize & compress: fit within MAX_DIMENSION, convert to JPEG
    const compressedBuffer = await sharp(rawBuffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: "inside",           // maintain aspect ratio
        withoutEnlargement: true, // don't upscale small images
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    const compressedSizeKB = Math.round(compressedBuffer.length / 1024);
    const base64 = compressedBuffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    const imageRef = `img_${randomUUID()}`;
    const TTL_MS = 60 * 60 * 1000; // 1 hour
    const expiresAt = Date.now() + TTL_MS;

    uploadedImages.set(imageRef, { dataUrl, expiresAt });

    request.log.info(
      {
        imageRef,
        originalSizeKB,
        compressedSizeKB,
        reduction: `${Math.round((1 - compressedBuffer.length / rawBuffer.length) * 100)}%`,
      },
      "Image uploaded, resized, and stored in-memory",
    );

    const result: UploadImageResult = {
      imageRef,
      expiresAt: new Date(expiresAt).toISOString(),
    };

    const response: ApiResponse<UploadImageResult> = {
      success: true,
      data: result,
      meta: {
        requestId: request.requestId ?? "unknown",
        timestamp: new Date().toISOString(),
      },
    };

    return reply.status(201).send(response);
  });
}
