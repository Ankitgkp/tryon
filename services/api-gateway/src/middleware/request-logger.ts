/**
 * Request logging middleware.
 *
 * Fastify has built-in pino logging, but this hook adds structured
 * request/response metadata useful for observability and debugging.
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "node:crypto";

/**
 * Assigns a unique request ID and logs request start.
 * The request ID is also returned in the response headers for traceability.
 */
export async function requestLogger(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const requestId = (request.headers["x-request-id"] as string) || randomUUID();

  // Make request ID available to all downstream handlers.
  request.requestId = requestId;

  // Echo request ID back to the caller for support/debugging.
  void reply.header("x-request-id", requestId);

  request.log.info(
    {
      requestId,
      method: request.method,
      url: request.url,
      tenantId: request.tenantId ?? "unauthenticated",
    },
    "Incoming request"
  );
}
