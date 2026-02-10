import { randomUUID } from "node:crypto";
import type {
  TryOnJob,
  CreateTryOnRequest,
  GenerationRequest,
  ModelTier,
  Garment,
  TenantPlan,
} from "@tryon/shared-types";
import type { JobStore } from "../store/index.js";
import type { GarmentClient } from "../clients/garment-client.js";
import type { ImageClient } from "../clients/image-client.js";
import { selectModelTier } from "./model-selector.js";

interface OrchestratorDeps {
  jobStore: JobStore;
  garmentClient: GarmentClient;
  imageClient: ImageClient;
  log: (msg: string, data?: Record<string, unknown>) => void;
}

export interface OrchestrateResult {
  success: true;
  job: TryOnJob;
  generationRequest: GenerationRequest;
}

export interface OrchestrateError {
  success: false;
  code: string;
  message: string;
}

/**
 * Core orchestration logic.
 *
 * 1. Validate that the garment exists (call garment-service).
 * 2. Validate that the user image exists (call image-service).
 * 3. Select the model tier.
 * 4. Build a vendor-agnostic GenerationRequest.
 * 5. Persist job with status "queued".
 * 6. Return the job + generation request (caller dispatches to AI service).
 *
 * This function does NOT call the AI provider — that's the AI Generation
 * Service's job (Phase 6). We return the GenerationRequest for the caller
 * to forward.
 */
export async function orchestrateTryOn(
  request: CreateTryOnRequest,
  tenantId: string,
  tenantPlan: TenantPlan,
  deps: OrchestratorDeps,
): Promise<OrchestrateResult | OrchestrateError> {
  const { jobStore, garmentClient, imageClient, log } = deps;

  // ── 1. Validate garment exists ───────────────────────────────────────────
  let garment: Garment | undefined;
  try {
    garment = await garmentClient.getGarment(request.garmentId);
  } catch (err) {
    log("Garment service call failed", {
      garmentId: request.garmentId,
      error: String(err),
    });
    return {
      success: false,
      code: "GARMENT_SERVICE_ERROR",
      message: "Unable to reach garment service",
    };
  }

  if (!garment) {
    return {
      success: false,
      code: "GARMENT_NOT_FOUND",
      message: `Garment ${request.garmentId} does not exist`,
    };
  }

  // ── 2. Validate user image exists & is uploaded ──────────────────────────
  try {
    const imageResult = await imageClient.validateImage(request.userImageRef);
    if (!imageResult.valid) {
      return {
        success: false,
        code: "USER_IMAGE_INVALID",
        message: `User image is invalid: ${imageResult.violations.join("; ")}`,
      };
    }
  } catch (err) {
    log("Image service call failed", {
      userImageRef: request.userImageRef,
      error: String(err),
    });
    return {
      success: false,
      code: "IMAGE_SERVICE_ERROR",
      message: "Unable to reach image service",
    };
  }

  // ── 3. Select model tier ─────────────────────────────────────────────────
  const modelTier: ModelTier = selectModelTier({
    tenantPlan,
    garmentType: garment.type,
    requestedTier: request.modelTier,
  });

  // ── 4. Build vendor-agnostic generation request ──────────────────────────
  const jobId = randomUUID();
  const now = new Date().toISOString();

  const generationRequest: GenerationRequest = {
    jobId,
    tenantId,
    modelTier,
    garmentType: garment.type,
    userImageUrl: request.userImageRef, // In production, resolve to a pre-signed URL
    garmentImageUrl: garment.imageUrl,
    garmentMaskUrl: garment.maskUrl,
    parameters: request.parameters ?? {},
  };

  // ── 5. Persist job record (queued) ───────────────────────────────────────
  const job: TryOnJob = {
    id: jobId,
    tenantId,
    status: "queued",
    userImageRef: request.userImageRef,
    garmentId: request.garmentId,
    modelTier,
    createdAt: now,
    updatedAt: now,
  };

  await jobStore.save(job);

  log("Try-on job created", { jobId, tenantId, modelTier, garmentType: garment.type });

  return { success: true, job, generationRequest };
}
