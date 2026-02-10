import type { ModelSelectionContext, ModelTier } from "@tryon/shared-types";

/**
 * Determines the AI model tier for a try-on job.
 *
 * Rules:
 *  1. If the caller explicitly requested a tier, honour it (subject to plan limits).
 *  2. Otherwise, map tenant plan → default tier.
 *  3. Free-tier tenants are capped at "standard".
 *
 * This function is intentionally pure — no I/O, easily testable.
 */
export function selectModelTier(ctx: ModelSelectionContext): ModelTier {
  // Explicit override — but free plan can never go above standard
  if (ctx.requestedTier) {
    if (ctx.tenantPlan === "free" && ctx.requestedTier !== "standard") {
      return "standard";
    }
    return ctx.requestedTier;
  }

  // Default mapping
  switch (ctx.tenantPlan) {
    case "enterprise":
      return "premium";
    case "pro":
      return "premium";
    case "starter":
      return "standard";
    case "free":
    default:
      return "standard";
  }
}
