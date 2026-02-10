/**
 * API Key authentication middleware.
 *
 * Validates the API key by calling the Tenant Service's /validate-key endpoint.
 * The gateway never inspects or stores keys itself — it delegates entirely.
 *
 * Design decision: API key is passed via `x-api-key` header.
 * This keeps auth out of the URL and is standard for SaaS APIs.
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import type { ApiResponse, ValidateKeyResult } from "@tryon/shared-types";

/**
 * Resolves the tenant-service base URL.
 * In production this would come from service discovery or an env var.
 */
function getTenantServiceUrl(): string {
  return process.env["TENANT_SERVICE_URL"] ?? "http://localhost:3001";
}

/**
 * Validates the API key by calling the tenant-service.
 * On success, attaches tenantId and plan to the request.
 * On failure, sends 401 and short-circuits the request.
 *
 * In development, set AUTH_BYPASS=true to skip validation entirely.
 */
export async function apiKeyAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // ── Dev bypass ────────────────────────────────────────────────────────
  // Skip real auth when AUTH_BYPASS=true (local development only).
  if (process.env["AUTH_BYPASS"] === "true") {
    request.tenantId = "dev_tenant";
    request.tenantPlan = "enterprise";
    return;
  }

  const apiKey = request.headers["x-api-key"];

  if (!apiKey || typeof apiKey !== "string") {
    reply.status(401).send({
      success: false,
      error: {
        code: "MISSING_API_KEY",
        message: "x-api-key header is required.",
      },
    });
    return;
  }

  try {
    const origin = request.headers["origin"] as string | undefined;
    const tenantServiceUrl = getTenantServiceUrl();

    const response = await fetch(`${tenantServiceUrl}/validate-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, origin }),
    });

    if (!response.ok) {
      request.log.error(
        { status: response.status },
        "Tenant service returned non-OK status"
      );
      reply.status(502).send({
        success: false,
        error: {
          code: "AUTH_SERVICE_ERROR",
          message: "Unable to validate API key. Please try again later.",
        },
      });
      return;
    }

    const body = (await response.json()) as ApiResponse<ValidateKeyResult>;
    const result = body.data;

    if (!result?.valid) {
      reply.status(401).send({
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: result?.reason ?? "The provided API key is not valid.",
        },
      });
      return;
    }

    // Attach tenant context for downstream route handlers.
    request.tenantId = result.tenantId;
    request.tenantPlan = result.plan;
  } catch (err) {
    request.log.error({ err }, "Failed to reach tenant service");
    reply.status(502).send({
      success: false,
      error: {
        code: "AUTH_SERVICE_UNAVAILABLE",
        message: "Authentication service is unavailable. Please try again later.",
      },
    });
  }
}
