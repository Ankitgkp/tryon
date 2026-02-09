/**
 * In-Memory Image Record Store
 *
 * Simple Map-backed implementation for development.
 * Auto-filters expired records on read.
 */

import type { StoredImageRecord } from "@tryon/shared-types";
import type { ImageRecordStore } from "./image-record-store.js";

export class InMemoryImageRecordStore implements ImageRecordStore {
  private readonly records = new Map<string, StoredImageRecord>();

  async save(record: StoredImageRecord): Promise<void> {
    this.records.set(record.imageRef, record);
  }

  async findByRef(imageRef: string): Promise<StoredImageRecord | undefined> {
    const record = this.records.get(imageRef);
    if (!record) return undefined;

    // Auto-filter expired records on read
    if (new Date(record.expiresAt) <= new Date()) {
      this.records.delete(imageRef);
      return undefined;
    }

    return record;
  }

  async markUploaded(imageRef: string): Promise<boolean> {
    const record = this.records.get(imageRef);
    if (!record) return false;
    record.uploaded = true;
    return true;
  }

  async delete(imageRef: string): Promise<void> {
    this.records.delete(imageRef);
  }

  async purgeExpired(): Promise<string[]> {
    const now = new Date();
    const purged: string[] = [];

    for (const [ref, record] of this.records) {
      if (new Date(record.expiresAt) <= now) {
        this.records.delete(ref);
        purged.push(ref);
      }
    }

    return purged;
  }

  /** Returns current record count (for monitoring). */
  recordCount(): number {
    return this.records.size;
  }
}
