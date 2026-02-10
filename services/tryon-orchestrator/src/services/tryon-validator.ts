// Validates a CreateTryOnRequest payload (shape only — no I/O).

interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates a CreateTryOnRequest payload (shape only — no I/O).
 * Downstream services verify that the referenced entities actually exist.
 */
export function validateCreateTryOnRequest(
  body: unknown,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== "object") {
    errors.push({ field: "body", message: "Request body must be a JSON object" });
    return errors;
  }

  const b = body as Record<string, unknown>;

  if (typeof b["userImageRef"] !== "string" || b["userImageRef"].trim().length === 0) {
    errors.push({
      field: "userImageRef",
      message: "userImageRef is required and must be a non-empty string",
    });
  }

  if (typeof b["garmentId"] !== "string" || b["garmentId"].trim().length === 0) {
    errors.push({
      field: "garmentId",
      message: "garmentId is required and must be a non-empty string",
    });
  }

  // modelTier — optional, but if present must be a valid value
  const validTiers = ["standard", "premium", "experimental"];
  if (b["modelTier"] !== undefined) {
    if (typeof b["modelTier"] !== "string" || !validTiers.includes(b["modelTier"])) {
      errors.push({
        field: "modelTier",
        message: `modelTier must be one of: ${validTiers.join(", ")}`,
      });
    }
  }

  // parameters — optional, must be object if present
  if (b["parameters"] !== undefined) {
    if (typeof b["parameters"] !== "object" || b["parameters"] === null || Array.isArray(b["parameters"])) {
      errors.push({
        field: "parameters",
        message: "parameters must be a plain object if provided",
      });
    }
  }

  return errors;
}
