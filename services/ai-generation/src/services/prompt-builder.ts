import type { GarmentType } from "@tryon/shared-types";


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
    "You are an expert e-commerce virtual try-on system. Your job is to show a customer exactly how a specific product will look on them.",
    "",
    "IMAGE 1 (first image): A photo of the customer/person.",
    "IMAGE 2 (second image): The EXACT product garment that must be placed on the person.",
    "",
    `TASK: Generate a single photorealistic image of the person from IMAGE 1 wearing the EXACT garment from IMAGE 2 on their ${region}.`,
    "",
    "STRICT GARMENT FIDELITY RULES (MOST IMPORTANT):",
    "- The garment in the output MUST be a pixel-accurate representation of IMAGE 2.",
    "- Reproduce the EXACT color(s), hue, and saturation — do NOT shift, tint, or alter any colors.",
    "- Reproduce the EXACT pattern, print, stripes, graphics, logos, text, or embroidery — do NOT simplify, omit, or reimagine any design elements.",
    "- Reproduce the EXACT fabric texture and material appearance (e.g. denim, linen, silk, knit).",
    "- Reproduce the EXACT garment structure: collar style, sleeve length, buttons, zippers, pockets, hems, seams, stitching details.",
    "- Do NOT invent, add, remove, or modify ANY detail of the garment. The output garment must be indistinguishable from IMAGE 2.",
    "- If IMAGE 2 shows a brand logo or label, it MUST appear in the output exactly as shown.",
    "",
    "PERSON PRESERVATION RULES:",
    "- The person's face, hair, skin tone, body shape, and pose must remain EXACTLY as in IMAGE 1.",
    "- The background must remain EXACTLY as in IMAGE 1.",
    "",
    "REALISM RULES:",
    "- The garment should look naturally worn — correct perspective, fit, lighting, shadows, and fabric draping that match the person's pose and the scene lighting.",
    "- Output a single photorealistic image. NOT a collage, NOT side-by-side, NOT a composite with visible seams.",
  ];

  if (extraContext) {
    lines.push("");
    lines.push(`Additional context: ${extraContext}`);
  }

  return lines.join("\n");
}
