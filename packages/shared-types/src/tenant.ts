/**
 * Tenant (brand) types.
 * Each tenant is an isolated brand using the platform.
 */

export interface Tenant {
  id: string;
  name: string;
  /** The hashed API key associated with this tenant. Never store plaintext. */
  apiKeyHash: string;
  /** Prefix of the key (e.g. "tryon_abc") for identification without exposing the full key. */
  apiKeyPrefix: string;
  plan: TenantPlan;
  /** Origins allowed to use this tenant's API key. Empty = no restriction. */
  allowedDomains: string[];
  createdAt: string;
}

/** Public-safe subset of Tenant — never includes key material. */
export interface TenantPublic {
  id: string;
  name: string;
  plan: TenantPlan;
  allowedDomains: string[];
  createdAt: string;
}

export type TenantPlan = "free" | "starter" | "pro" | "enterprise";

// ─── POST /validate-key ──────────────────────────────────────────────────────

export interface ValidateKeyRequest {
  apiKey: string;
  /** The Origin header from the client request, for domain allowlisting. */
  origin?: string;
}

export interface ValidateKeyResult {
  valid: boolean;
  tenantId?: string;
  plan?: TenantPlan;
  /** Reason for rejection, if invalid. */
  reason?: string;
}
