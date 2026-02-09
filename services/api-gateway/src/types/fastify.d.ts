/**
 * Fastify type augmentations for the API Gateway.
 *
 * Extends FastifyRequest with custom properties injected by middleware
 * (e.g., tenantId from API key auth, requestId from logger).
 */

import "fastify";
import type { TenantPlan } from "@tryon/shared-types";

declare module "fastify" {
  interface FastifyRequest {
    /** Tenant ID resolved from the API key. Set by api-key-auth middleware. */
    tenantId?: string;
    /** Tenant's subscription plan. Set by api-key-auth middleware. */
    tenantPlan?: TenantPlan;
    /** Unique request ID for tracing. Set by request-logger middleware. */
    requestId?: string;
  }
}
