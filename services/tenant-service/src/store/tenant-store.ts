/**
 * Tenant Store Interface
 *
 * Defines the contract for tenant persistence.
 * The current implementation is in-memory; a database-backed
 * implementation can replace it without changing any consumers.
 */

import type { Tenant } from "@tryon/shared-types";

export interface TenantStore {
  /** Find a tenant by ID. Returns undefined if not found. */
  findById(id: string): Promise<Tenant | undefined>;

  /** Find a tenant by API key prefix (the "tryon_xxxx" part). */
  findByKeyPrefix(prefix: string): Promise<Tenant | undefined>;

  /** Create a new tenant. Throws if ID already exists. */
  create(tenant: Tenant): Promise<Tenant>;

  /** List all tenants. For admin/debugging — not exposed publicly. */
  listAll(): Promise<Tenant[]>;
}
