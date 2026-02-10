import {
  TransientProviderError,
  PermanentProviderError,
} from "../providers/ai-provider.js";

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  log: (msg: string, data?: Record<string, unknown>) => void;
}

/**
 * Retry wrapper with exponential backoff.
 *
 * - Retries only on TransientProviderError
 * - Immediately rethrows PermanentProviderError
 * - Unknown errors are treated as transient
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      // Permanent errors — don't retry
      if (err instanceof PermanentProviderError) {
        throw err;
      }

      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < config.maxRetries) {
        const delay = config.baseDelayMs * Math.pow(2, attempt);
        const jitter = Math.random() * delay * 0.1; // 10% jitter
        const totalDelay = Math.round(delay + jitter);

        config.log("Retrying after transient error", {
          attempt: attempt + 1,
          maxRetries: config.maxRetries,
          delayMs: totalDelay,
          error: lastError.message,
        });

        await new Promise((resolve) => setTimeout(resolve, totalDelay));
      }
    }
  }

  throw lastError ?? new TransientProviderError("All retries exhausted");
}
