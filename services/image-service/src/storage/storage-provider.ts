/**
 * Object Storage Provider — Interface
 *
 * Abstracts the underlying storage backend (S3, GCS, Azure Blob, local FS).
 * Any implementation MUST honor TTL — expired objects must become inaccessible.
 *
 * PRIVACY CONTRACT:
 * - Implementations MUST NOT retain objects beyond their expiresAt timestamp
 * - Implementations MUST support deletion on demand
 * - No implementation may disable expiry
 */

export interface PreSignedUploadUrl {
  /** The URL the client should PUT the file to. */
  url: string;
  /** Headers the client must include. */
  headers: Record<string, string>;
  /** When this pre-signed URL itself expires (ISO 8601). */
  expiresAt: string;
}

export interface ObjectStorageProvider {
  /**
   * Generates a pre-signed URL for uploading an object.
   * The URL is valid for `urlTtlSeconds` and the object itself
   * will be auto-deleted at `objectExpiresAt`.
   */
  createPresignedUploadUrl(params: {
    key: string;
    contentType: string;
    fileSizeBytes: number;
    /** How long the upload URL is valid, in seconds. */
    urlTtlSeconds: number;
    /** When the stored object should be deleted (ISO 8601). */
    objectExpiresAt: string;
  }): Promise<PreSignedUploadUrl>;

  /**
   * Generates a pre-signed URL for reading an object.
   * Used internally to pass images to downstream services.
   */
  createPresignedReadUrl(params: {
    key: string;
    ttlSeconds: number;
  }): Promise<string>;

  /**
   * Immediately deletes an object. Idempotent — does not throw if missing.
   */
  deleteObject(key: string): Promise<void>;

  /**
   * Checks if an object exists and has been uploaded.
   */
  objectExists(key: string): Promise<boolean>;
}
