/**
 * Try-On routes.
 *
 * POST /v1/tryon    — Create a virtual try-on job, dispatch to AI Generation Service
 * GET  /v1/tryon/:id — Poll job status
 *
 * Calls the AI Generation Service (port 3005) to produce a real AI-generated
 * try-on image using the user's uploaded photo + garment image.
 */

import type { FastifyInstance } from "fastify";
import type { ApiResponse, CreateTryOnResult } from "@tryon/shared-types";
import { randomUUID } from "node:crypto";
import { uploadedImages } from "./upload-image.js";

const AI_GENERATION_URL =
  process.env["AI_GENERATION_URL"] ?? "http://localhost:3005";

// In-memory job store
interface TryOnJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: string;
  result?: {
    resultImageUrl: string;
    processingTimeMs: number;
    modelId: string;
  };
  failureReason?: string;
}

const jobs = new Map<string, TryOnJob>();

export async function tryonRoute(app: FastifyInstance): Promise<void> {
  // ── POST /tryon ─────────────────────────────────────────────────────────
  app.post("/tryon", async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const userImageRef = body.userImageRef as string | undefined;
    const garmentId = body.garmentId as string | undefined;
    const garmentImageUrl = body.garmentImageUrl as string | undefined;
    const garmentType = (body.garmentType as string | undefined) ?? "TOP";

    if (!userImageRef) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "userImageRef is required.",
        },
        meta: { requestId: request.requestId ?? "unknown", timestamp: new Date().toISOString() },
      } satisfies ApiResponse);
    }

    if (!garmentId && !garmentImageUrl) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Either garmentId or garmentImageUrl is required.",
        },
        meta: { requestId: request.requestId ?? "unknown", timestamp: new Date().toISOString() },
      } satisfies ApiResponse);
    }

    // Resolve the user image to a data URL from the in-memory store
    const uploadedImage = uploadedImages.get(userImageRef);
    let userImageUrl: string;

    if (uploadedImage) {
      userImageUrl = uploadedImage.dataUrl;
      request.log.info({ userImageRef }, "Resolved user image from in-memory store");
    } else {
      // If not found in store, treat the ref as a URL (fallback)
      userImageUrl = userImageRef;
      request.log.warn({ userImageRef }, "User image ref not found in store, using as-is");
    }

    // Resolve garment image URL
    const resolvedGarmentImageUrl = garmentImageUrl ?? "";

    const jobId = randomUUID();
    const now = new Date().toISOString();

    // Create job as "processing"
    const job: TryOnJob = {
      id: jobId,
      status: "processing",
      createdAt: now,
    };
    jobs.set(jobId, job);

    // Return 202 immediately, then dispatch AI generation in background
    const result: CreateTryOnResult = {
      jobId,
      status: "processing",
      createdAt: now,
    };

    reply.status(202).send({
      success: true,
      data: result,
      meta: { requestId: request.requestId ?? "unknown", timestamp: new Date().toISOString() },
    } satisfies ApiResponse<CreateTryOnResult>);

    // ── Dispatch to AI Generation Service in background ──────────────────
    dispatchAIGeneration(jobId, {
      userImageUrl,
      garmentImageUrl: resolvedGarmentImageUrl,
      garmentType,
      log: request.log,
    }).catch((err) => {
      request.log.error({ jobId, error: String(err) }, "Background AI dispatch failed");
    });
  });

  // ── GET /tryon/:id ──────────────────────────────────────────────────────
  app.get<{ Params: { id: string } }>("/tryon/:id", async (request, reply) => {
    const { id } = request.params;
    const job = jobs.get(id);

    if (!job) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Job not found." },
        meta: { requestId: request.requestId ?? "unknown", timestamp: new Date().toISOString() },
      } satisfies ApiResponse);
    }

    return reply.status(200).send({
      success: true,
      data: job,
      meta: { requestId: request.requestId ?? "unknown", timestamp: new Date().toISOString() },
    } satisfies ApiResponse<TryOnJob>);
  });
}

// ─── Background AI dispatch ──────────────────────────────────────────────────

interface DispatchParams {
  userImageUrl: string;
  garmentImageUrl: string;
  garmentType: string;
  log: { info: (obj: Record<string, unknown>, msg: string) => void; error: (obj: Record<string, unknown>, msg: string) => void };
}

async function dispatchAIGeneration(
  jobId: string,
  params: DispatchParams,
): Promise<void> {
  const { userImageUrl, garmentImageUrl, garmentType, log } = params;

  const job = jobs.get(jobId);
  if (!job) return;

  const startTime = Date.now();

  try {
    log.info({ jobId, aiServiceUrl: AI_GENERATION_URL }, "Dispatching to AI Generation Service");

    const aiResponse = await fetch(`${AI_GENERATION_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        tenantId: "dev_tenant",
        modelTier: "standard",
        garmentType,
        userImageUrl,
        garmentImageUrl,
        parameters: {},
      }),
    });

    const aiResult = (await aiResponse.json()) as {
      success: boolean;
      data?: {
        jobId: string;
        imageUrl: string;
        processingTimeMs: number;
        modelId: string;
      };
      error?: { code: string; message: string };
    };

    if (!aiResponse.ok || !aiResult.success || !aiResult.data) {
      const errMsg = aiResult.error?.message ?? `AI service returned ${aiResponse.status}`;
      log.error({ jobId, statusCode: aiResponse.status, error: errMsg }, "AI generation failed");

      job.status = "failed";
      job.failureReason = errMsg;
      return;
    }

    log.info(
      { jobId, processingTimeMs: aiResult.data.processingTimeMs, modelId: aiResult.data.modelId },
      "AI generation completed successfully",
    );

    job.status = "completed";
    job.result = {
      resultImageUrl: aiResult.data.imageUrl,
      processingTimeMs: aiResult.data.processingTimeMs,
      modelId: aiResult.data.modelId,
    };
  } catch (err) {
    const totalTimeMs = Date.now() - startTime;
    log.error({ jobId, totalTimeMs, error: String(err) }, "AI generation dispatch error");

    job.status = "failed";
    job.failureReason = `AI service unreachable: ${String(err)}`;
  }
}
