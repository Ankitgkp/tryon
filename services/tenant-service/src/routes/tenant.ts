/**
 * GET /tenant/:id
 *
 * Returns public tenant information by ID.
 * Never exposes key material (hashes, prefixes).
 *
 * This is an internal endpoint — used by other services to resolve
 * tenant metadata (e.g., plan, allowed domains).
 */

import type { FastifyInstance } from "fastify";
import type { ApiResponse, TenantPublic } from "@tryon/shared-types";
import type { TenantStore } from "../store/tenant-store.js";

export function tenantRoute(store: TenantStore) {
  return async function (app: FastifyInstance): Promise<void> {
    app.get<{ Params: { id: string } }>("/tenant/:id", async (request, reply) => {
      const { id } = request.params;

      const tenant = await store.findById(id);
      if (!tenant) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "TENANT_NOT_FOUND",
            message: `Tenant "${id}" not found.`,
          },
        };
        return reply.status(404).send(response);
      }

      // Strip sensitive fields — never return key material.
      const publicTenant: TenantPublic = {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        allowedDomains: tenant.allowedDomains,
        createdAt: tenant.createdAt,
      };

      const response: ApiResponse<TenantPublic> = {
        success: true,
        data: publicTenant,
      };
      return reply.status(200).send(response);
    });
  };
}
