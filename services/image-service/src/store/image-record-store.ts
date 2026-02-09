/**
 * Image Record Store — Interface
 *
 * Tracks metadata about uploaded images. Separate from the object storage
 * provider so we can query records without hitting the storage backend.
 *
 * PRIVACY: All records MUST have an expiresAt. The cleanup scheduler
 * is responsible for purging expired records AND their storage objects.
 */

import type { StoredImageRecord } from "@tryon/shared-types";

export interface ImageRecordStore {
  /** Save a new image record. */
  save(record: StoredImageRecord): Promise<void>;

  /** Find an image record by reference ID. Returns undefined if not found or expired. */
  findByRef(imageRef: string): Promise<StoredImageRecord | undefined>;

  /** Mark an image as uploaded (PUT completed). */
  markUploaded(imageRef: string): Promise<boolean>;

  /** Delete a record. */
  delete(imageRef: string): Promise<void>;

  /** Purge all expired records. Returns the refs of purged records. */
  purgeExpired(): Promise<string[]>;
}
