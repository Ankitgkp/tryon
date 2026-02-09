/**
 * In-Memory Tenant Store
 *
 * Simple Map-backed implementation for development and testing.
 * Seeded with a few demo tenants so the platform is usable out of the box.
 *
 * Limitations:
 * - Data is lost on restart
 * - No concurrency safety (fine for single-process dev)
 * - No pagination on listAll
 *
 * TODO [Phase 3+]: Replace with a database-backed implementation.
 */

import type { Tenant } from "@tryon/shared-types";
import type { TenantStore } from "./tenant-store.js";
import { generateApiKey, hashKey } from "../services/api-key-service.js";

export class InMemoryTenantStore implements TenantStore {
  private readonly tenants = new Map<string, Tenant>();
  /** Secondary index: apiKeyPrefix → tenantId for fast lookups. */
  private readonly prefixIndex = new Map<string, string>();

  constructor() {
    this.seed();
  }

  async findById(id: string): Promise<Tenant | undefined> {
    return this.tenants.get(id);
  }

  async findByKeyPrefix(prefix: string): Promise<Tenant | undefined> {
    const tenantId = this.prefixIndex.get(prefix);
    if (!tenantId) return undefined;
    return this.tenants.get(tenantId);
  }

  async create(tenant: Tenant): Promise<Tenant> {
    if (this.tenants.has(tenant.id)) {
      throw new Error(`Tenant with id "${tenant.id}" already exists.`);
    }
    this.tenants.set(tenant.id, tenant);
    this.prefixIndex.set(tenant.apiKeyPrefix, tenant.id);
    return tenant;
  }

  async listAll(): Promise<Tenant[]> {
    return Array.from(this.tenants.values());
  }

  /**
   * Seeds the store with demo tenants.
   * Logs the plaintext keys to console in development so devs can test.
   * In production, keys would be provisioned through an admin API.
   */
  private seed(): void {
    const demoTenants = [
      { id: "tenant_acme", name: "Acme Fashion", plan: "pro" as const },
      { id: "tenant_demo", name: "Demo Brand", plan: "free" as const },
    ];

    for (const demo of demoTenants) {
      const key = generateApiKey();

      const tenant: Tenant = {
        id: demo.id,
        name: demo.name,
        apiKeyHash: key.hash,
        apiKeyPrefix: key.prefix,
        plan: demo.plan,
        allowedDomains: [],
        createdAt: new Date().toISOString(),
      };

      this.tenants.set(tenant.id, tenant);
      this.prefixIndex.set(tenant.apiKeyPrefix, tenant.id);

      // Only log keys in non-production — these are secrets.
      // eslint-disable-next-line no-console
      console.log(
        `[seed] Tenant "${demo.name}" (${demo.id}) → API key: ${key.plaintext}`
      );
    }
  }
}

/**
 * Convenience: create a well-known demo key for local development.
 * This key is deterministic so devs don't have to copy from logs every restart.
 * It is NOT used in production.
 */
export function createDevTenant(): { tenant: Tenant; plaintext: string } {
  const plaintext = "tryon_dev00000_dev000000000000000000000000000000";
  const hash = hashKey(plaintext);

  const tenant: Tenant = {
    id: "tenant_dev",
    name: "Local Development",
    apiKeyHash: hash,
    apiKeyPrefix: "tryon_dev00000",
    plan: "enterprise",
    allowedDomains: [],
    createdAt: new Date().toISOString(),
  };

  return { tenant, plaintext };
}
