import type { TryOnJob, TryOnJobStatus } from "@tryon/shared-types";

/**
 * Persistence interface for try-on job records.
 * Swap InMemoryJobStore for a real DB-backed implementation in production.
 */
export interface JobStore {
  /** Save or update a job record. */
  save(job: TryOnJob): Promise<void>;

  /** Find a job by its unique ID. */
  findById(id: string): Promise<TryOnJob | undefined>;

  /** Find all jobs for a tenant, newest first. */
  findByTenantId(tenantId: string): Promise<TryOnJob[]>;

  /** Atomically update a job's status and optional fields. */
  updateStatus(
    id: string,
    status: TryOnJobStatus,
    patch?: Partial<Pick<TryOnJob, "result" | "failureReason">>,
  ): Promise<TryOnJob | undefined>;
}
