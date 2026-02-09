/**
 * Expiry Cleanup Scheduler
 *
 * Periodically purges expired image records and their storage objects.
 * This is a critical privacy mechanism — without it, "temporary" images
 * would accumulate indefinitely.
 *
 * In production, this would be a separate cron job or cloud function.
 * For now, it runs as a setInterval within the service process.
 */

import type { ImageRecordStore } from "../store/image-record-store.js";
import type { ObjectStorageProvider } from "../storage/storage-provider.js";

export interface CleanupStats {
  purgedRecords: number;
  errors: number;
}

export class ExpiryScheduler {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private readonly intervalMs: number;
  private readonly store: ImageRecordStore;
  private readonly storage: ObjectStorageProvider;
  private readonly log: (msg: string) => void;

  constructor(params: {
    store: ImageRecordStore;
    storage: ObjectStorageProvider;
    /** How often to run cleanup, in milliseconds. Default: 60s. */
    intervalMs?: number;
    log?: (msg: string) => void;
  }) {
    this.store = params.store;
    this.storage = params.storage;
    this.intervalMs = params.intervalMs ?? 60_000;
    // eslint-disable-next-line no-console
    this.log = params.log ?? console.log;
  }

  /**
   * Starts the cleanup scheduler.
   */
  start(): void {
    if (this.intervalHandle) return; // Already running

    this.log(
      `[expiry-scheduler] Starting cleanup every ${this.intervalMs / 1000}s`
    );

    this.intervalHandle = setInterval(() => {
      void this.runCleanup();
    }, this.intervalMs);

    // Don't prevent process exit
    this.intervalHandle.unref();
  }

  /**
   * Stops the cleanup scheduler.
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      this.log("[expiry-scheduler] Stopped");
    }
  }

  /**
   * Runs a single cleanup pass. Can be called manually for testing.
   */
  async runCleanup(): Promise<CleanupStats> {
    let errors = 0;

    // 1. Purge expired records from the metadata store
    const purgedRefs = await this.store.purgeExpired();

    // 2. Delete the corresponding objects from storage
    for (const ref of purgedRefs) {
      try {
        await this.storage.deleteObject(ref);
      } catch {
        errors++;
      }
    }

    if (purgedRefs.length > 0) {
      this.log(
        `[expiry-scheduler] Purged ${purgedRefs.length} expired images (${errors} storage errors)`
      );
    }

    return { purgedRecords: purgedRefs.length, errors };
  }
}
