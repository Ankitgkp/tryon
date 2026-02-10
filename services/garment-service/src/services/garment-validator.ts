import {
  GARMENT_TYPES,
  GARMENT_CATEGORIES,
  type GarmentType,
  type GarmentCategory,
} from "@tryon/shared-types";

interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates a CreateGarmentRequest payload.
 * Returns an array of validation errors (empty = valid).
 */
export function validateCreateGarmentRequest(
  body: unknown,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== "object") {
    errors.push({ field: "body", message: "Request body must be a JSON object" });
    return errors;
  }

  const b = body as Record<string, unknown>;

  // name — required, non-empty string, max 200 chars
  if (typeof b["name"] !== "string" || b["name"].trim().length === 0) {
    errors.push({ field: "name", message: "name is required and must be a non-empty string" });
  } else if (b["name"].length > 200) {
    errors.push({ field: "name", message: "name must be at most 200 characters" });
  }

  // type — required, must be a valid GarmentType
  const validTypes: readonly string[] = GARMENT_TYPES;
  if (typeof b["type"] !== "string" || !validTypes.includes(b["type"])) {
    errors.push({
      field: "type",
      message: `type must be one of: ${GARMENT_TYPES.join(", ")}`,
    });
  }

  // category — required, must be a valid GarmentCategory, must match the parent type
  const validCategories = Object.keys(GARMENT_CATEGORIES);
  if (typeof b["category"] !== "string" || !validCategories.includes(b["category"])) {
    errors.push({
      field: "category",
      message: `category must be one of: ${validCategories.join(", ")}`,
    });
  } else if (
    typeof b["type"] === "string" &&
    validTypes.includes(b["type"])
  ) {
    const parentType = GARMENT_CATEGORIES[b["category"] as GarmentCategory];
    if (parentType !== (b["type"] as GarmentType)) {
      errors.push({
        field: "category",
        message: `category "${b["category"]}" does not belong to type "${b["type"]}"; expected type "${parentType}"`,
      });
    }
  }

  // imageUrl — required, non-empty string
  if (typeof b["imageUrl"] !== "string" || b["imageUrl"].trim().length === 0) {
    errors.push({ field: "imageUrl", message: "imageUrl is required and must be a non-empty string" });
  }

  // maskUrl — optional, but if present must be a string
  if (b["maskUrl"] !== undefined && typeof b["maskUrl"] !== "string") {
    errors.push({ field: "maskUrl", message: "maskUrl must be a string if provided" });
  }

  // attributes — optional, but if present must be Record<string, string>
  if (b["attributes"] !== undefined) {
    if (typeof b["attributes"] !== "object" || b["attributes"] === null || Array.isArray(b["attributes"])) {
      errors.push({ field: "attributes", message: "attributes must be a plain object if provided" });
    } else {
      const attrs = b["attributes"] as Record<string, unknown>;
      for (const [key, value] of Object.entries(attrs)) {
        if (typeof value !== "string") {
          errors.push({
            field: `attributes.${key}`,
            message: `attribute value for key "${key}" must be a string`,
          });
        }
      }
    }
  }

  return errors;
}
