import type { GarmentType } from "@tryon/shared-types";

/**
 * Builds the text prompt for the AI model.
 *
 * Adapts the prompt based on garment type so the model knows which
 * body region to target. Keeps prompts short and structured.
 */
export function buildTryOnPrompt(
  garmentType: GarmentType,
  extraContext?: string,
): string {
  const regionMap: Record<GarmentType, string> = {
    TOP: "upper body (torso and arms)",
    BOTTOM: "lower body (waist to feet)",
    DRESS: "full body (torso to knees/feet)",
    OUTERWEAR: "outer layer over the upper body",
    ACCESSORY: "appropriate body region for this accessory",
  };

  const region = regionMap[garmentType] ?? "body";

  const lines = [
    "Virtual try-on: Place the garment from the second image onto the person in the first image.",
    `Target region: ${region}.`,
    "Preserve the person's pose, body shape, skin tone, and background exactly.",
    "The garment should look naturally worn — correct lighting, shadows, and fabric draping.",
    "Output a single photorealistic image.",
  ];

  if (extraContext) {
    lines.push(`Additional context: ${extraContext}`);
  }

  return lines.join(" ");
}
