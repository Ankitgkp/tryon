/**
 * Global error handler for the API Gateway.
 *
 * Catches all unhandled errors and returns a consistent ApiResponse envelope.
 * Never leaks internal error details in production.
 */

import type { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import type { ApiResponse } from "@tryon/shared-types";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const statusCode = error.statusCode ?? 500;
  const isServerError = statusCode >= 500;

  // Log full error internally, return safe message externally.
  request.log.error(
    {
      err: error,
      requestId: request.requestId,
      statusCode,
    },
    isServerError ? "Internal server error" : "Client error"
  );

  const response: ApiResponse = {
    success: false,
    error: {
      code: error.code ?? "INTERNAL_ERROR",
      message: isServerError
        ? "An unexpected error occurred. Please try again later."
        : error.message,
    },
    meta: {
      requestId: request.requestId ?? "unknown",
      timestamp: new Date().toISOString(),
    },
  };

  void reply.status(statusCode).send(response);
}
