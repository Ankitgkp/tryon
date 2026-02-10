import type { TryOnJob, TryOnJobStatus } from "@tryon/shared-types";
import type { JobStore } from "./job-store.js";

export class InMemoryJobStore implements JobStore {
  private readonly jobs = new Map<string, TryOnJob>();

  async save(job: TryOnJob): Promise<void> {
    this.jobs.set(job.id, { ...job });
  }

  async findById(id: string): Promise<TryOnJob | undefined> {
    const job = this.jobs.get(id);
    return job ? { ...job } : undefined;
  }

  async findByTenantId(tenantId: string): Promise<TryOnJob[]> {
    const results: TryOnJob[] = [];
    for (const job of Array.from(this.jobs.values())) {
      if (job.tenantId === tenantId) {
        results.push({ ...job });
      }
    }
    // Newest first
    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async updateStatus(
    id: string,
    status: TryOnJobStatus,
    patch?: Partial<Pick<TryOnJob, "result" | "failureReason">>,
  ): Promise<TryOnJob | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    job.status = status;
    job.updatedAt = new Date().toISOString();

    if (patch?.result !== undefined) job.result = patch.result;
    if (patch?.failureReason !== undefined) job.failureReason = patch.failureReason;

    return { ...job };
  }
}
