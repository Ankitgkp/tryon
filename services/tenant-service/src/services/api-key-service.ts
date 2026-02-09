/**
 * API Key Service
 *
 * Handles cryptographic operations for API keys:
 * - Generation of secure random keys
 * - Hashing keys for storage (never store plaintext)
 * - Constant-time comparison to prevent timing attacks
 *
 * Design decisions:
 * - Keys use format: "tryon_{prefix}_{secret}" for easy identification
 * - SHA-256 for hashing (sufficient for API keys, fast lookups)
 * - Constant-time comparison via crypto.timingSafeEqual
 * - Prefix is stored separately for key identification without full comparison
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Format: tryon_{8-char-prefix}_{32-char-secret} */
const KEY_PREFIX = "tryon";
const PREFIX_LENGTH = 8;
const SECRET_LENGTH = 32;

export interface GeneratedKey {
  /** The full plaintext key — shown to the tenant once, never stored. */
  plaintext: string;
  /** SHA-256 hash of the full key — stored in the database. */
  hash: string;
  /** First segment after "tryon_" — stored for identification. */
  prefix: string;
}

/**
 * Generates a new API key with a random prefix and secret.
 */
export function generateApiKey(): GeneratedKey {
  const prefix = randomBytes(PREFIX_LENGTH / 2).toString("hex"); // 8 hex chars
  const secret = randomBytes(SECRET_LENGTH / 2).toString("hex"); // 32 hex chars
  const plaintext = `${KEY_PREFIX}_${prefix}_${secret}`;

  return {
    plaintext,
    hash: hashKey(plaintext),
    prefix: `${KEY_PREFIX}_${prefix}`,
  };
}

/**
 * Hashes an API key for storage.
 */
export function hashKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/**
 * Constant-time comparison of two key hashes.
 * Prevents timing attacks where an attacker could infer valid keys
 * by measuring response time differences.
 */
export function compareKeyHash(
  candidateHash: string,
  storedHash: string
): boolean {
  if (candidateHash.length !== storedHash.length) return false;

  try {
    return timingSafeEqual(
      Buffer.from(candidateHash, "hex"),
      Buffer.from(storedHash, "hex")
    );
  } catch {
    // If buffers can't be created (e.g., invalid hex), keys don't match.
    return false;
  }
}
