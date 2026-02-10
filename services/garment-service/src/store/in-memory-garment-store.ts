import type { Garment } from "@tryon/shared-types";
import type { GarmentStore } from "./garment-store.js";

export class InMemoryGarmentStore implements GarmentStore {
  private readonly garments = new Map<string, Garment>();

  async findById(id: string): Promise<Garment | undefined> {
    return this.garments.get(id);
  }

  async findByTenantId(tenantId: string): Promise<Garment[]> {
    const results: Garment[] = [];
    for (const garment of this.garments.values()) {
      if (garment.tenantId === tenantId) {
        results.push(garment);
      }
    }
    return results;
  }

  async create(garment: Garment): Promise<void> {
    this.garments.set(garment.id, garment);
  }
}
