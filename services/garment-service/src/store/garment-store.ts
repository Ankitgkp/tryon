import type { Garment } from "@tryon/shared-types";

export interface GarmentStore {
  findById(id: string): Promise<Garment | undefined>;
  findByTenantId(tenantId: string): Promise<Garment[]>;
  create(garment: Garment): Promise<void>;
}
