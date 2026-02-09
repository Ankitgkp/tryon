/**
 * Mock Object Storage Provider
 *
 * In-memory implementation that simulates S3-like pre-signed URL behavior.
 * Used for local development and testing.
 *
 * Behavior:
 * - "Uploaded" objects are tracked in memory
 * - Pre-signed URLs point to a mock endpoint on this service
 * - Expired objects are purged by the cleanup scheduler
 *
 * NOT for production — replace with a real S3/GCS provider.
 */

import type {
  ObjectStorageProvider,
  PreSignedUploadUrl,
} from "./storage-provider.js";
import { randomBytes } from "node:crypto";

interface MockObject {
  key: string;
  contentType: string;
  fileSizeBytes: number;
  uploaded: boolean;
  expiresAt: string;
}

export class MockStorageProvider implements ObjectStorageProvider {
  /** In-memory object registry. */
  private readonly objects = new Map<string, MockObject>();
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async createPresignedUploadUrl(params: {
    key: string;
    contentType: string;
    fileSizeBytes: number;
    urlTtlSeconds: number;
    objectExpiresAt: string;
  }): Promise<PreSignedUploadUrl> {
    // Generate a mock signature token
    const token = randomBytes(16).toString("hex");

    // Register the object as "pending upload"
    this.objects.set(params.key, {
      key: params.key,
      contentType: params.contentType,
      fileSizeBytes: params.fileSizeBytes,
      uploaded: false,
      expiresAt: params.objectExpiresAt,
    });

    const urlExpiresAt = new Date(
      Date.now() + params.urlTtlSeconds * 1000
    ).toISOString();

    return {
      url: `${this.baseUrl}/${params.key}?token=${token}&expires=${urlExpiresAt}`,
      headers: {
        "Content-Type": params.contentType,
        "Content-Length": String(params.fileSizeBytes),
        "x-mock-token": token,
      },
      expiresAt: urlExpiresAt,
    };
  }

  async createPresignedReadUrl(params: {
    key: string;
    ttlSeconds: number;
  }): Promise<string> {
    const token = randomBytes(16).toString("hex");
    const expires = new Date(
      Date.now() + params.ttlSeconds * 1000
    ).toISOString();
    return `${this.baseUrl}/${params.key}?token=${token}&expires=${expires}`;
  }

  async deleteObject(key: string): Promise<void> {
    this.objects.delete(key);
  }

  async objectExists(key: string): Promise<boolean> {
    const obj = this.objects.get(key);
    if (!obj) return false;

    // Check expiry
    if (new Date(obj.expiresAt) <= new Date()) {
      this.objects.delete(key);
      return false;
    }

    return obj.uploaded;
  }

  /**
   * Marks an object as uploaded.
   * In a real S3 implementation, this would be handled by the PUT callback.
   * In mock mode, we expose this so routes can simulate a completed upload.
   */
  markAsUploaded(key: string): boolean {
    const obj = this.objects.get(key);
    if (!obj) return false;
    obj.uploaded = true;
    return true;
  }

  /**
   * Purges all expired objects. Called by the cleanup scheduler.
   * Returns the number of objects purged.
   */
  purgeExpired(): number {
    const now = new Date();
    let purged = 0;
    for (const [key, obj] of this.objects) {
      if (new Date(obj.expiresAt) <= now) {
        this.objects.delete(key);
        purged++;
      }
    }
    return purged;
  }

  /** Returns current object count (for monitoring/debugging). */
  objectCount(): number {
    return this.objects.size;
  }
}
