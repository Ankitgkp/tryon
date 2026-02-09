/**
 * POST /validate-key
 *
 * Internal endpoint called by the API Gateway to validate an API key.
 * This is NOT a public endpoint — it should only be reachable from
 * within the service mesh (enforced at the infrastructure layer).
 *
 * Flow:
 * 1. Extract the prefix from the key to find the tenant
 * 2. Hash the full key and compare against stored hash (constant-time)
 * 3. Check domain allowlist if origin is provided
 * 4. Return validation result with tenant context
 */

import type { FastifyInstance } from "fastify";
import type {
  ApiResponse,
  ValidateKeyRequest,
  ValidateKeyResult,
} from "@tryon/shared-types";
import type { TenantStore } from "../store/tenant-store.js";
import { hashKey, compareKeyHash } from "../services/api-key-service.js";
import { isDomainAllowed } from "../services/domain-service.js";

/** Extracts the prefix portion ("tryon_xxxxxxxx") from a full API key. */
function extractPrefix(apiKey: string): string | null {
  // Expected format: tryon_{8chars}_{32chars}
  const parts = apiKey.split("_");
  if (parts.length < 3 || parts[0] !== "tryon") return null;
  return `tryon_${parts[1]}`;
}

export function validateKeyRoute(store: TenantStore) {
  return async function (app: FastifyInstance): Promise<void> {
    app.post<{ Body: ValidateKeyRequest }>("/validate-key", async (request, reply) => {
      const { apiKey, origin } = request.body ?? {};

      if (!apiKey || typeof apiKey !== "string") {
        const response: ApiResponse<ValidateKeyResult> = {
          success: true,
          data: { valid: false, reason: "API key is required." },
        };
        return reply.status(200).send(response);
      }

      // Step 1: Extract prefix and find tenant
      const prefix = extractPrefix(apiKey);
      if (!prefix) {
        const response: ApiResponse<ValidateKeyResult> = {
          success: true,
          data: { valid: false, reason: "Malformed API key." },
        };
        return reply.status(200).send(response);
      }

      const tenant = await store.findByKeyPrefix(prefix);
      if (!tenant) {
        // Don't reveal whether the prefix exists — same generic message.
        const response: ApiResponse<ValidateKeyResult> = {
          success: true,
          data: { valid: false, reason: "Invalid API key." },
        };
        return reply.status(200).send(response);
      }

      // Step 2: Constant-time hash comparison
      const candidateHash = hashKey(apiKey);
      if (!compareKeyHash(candidateHash, tenant.apiKeyHash)) {
        const response: ApiResponse<ValidateKeyResult> = {
          success: true,
          data: { valid: false, reason: "Invalid API key." },
        };
        return reply.status(200).send(response);
      }

      // Step 3: Domain allowlist check
      if (!isDomainAllowed(origin, tenant.allowedDomains)) {
        request.log.warn(
          { tenantId: tenant.id, origin },
          "Domain not in allowlist"
        );
        const response: ApiResponse<ValidateKeyResult> = {
          success: true,
          data: { valid: false, reason: "Origin not allowed." },
        };
        return reply.status(200).send(response);
      }

      // Step 4: Valid — return tenant context
      const response: ApiResponse<ValidateKeyResult> = {
        success: true,
        data: {
          valid: true,
          tenantId: tenant.id,
          plan: tenant.plan,
        },
      };
      return reply.status(200).send(response);
    });
  };
}
