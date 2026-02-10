/**
 * Public SDK types.
 *
 * These types form the contract between SDK consumers and the widget.
 * Keep them minimal and stable — breaking changes here break integrations.
 */

// ─── Configuration ───────────────────────────────────────────────────────────

/** Configuration passed to `TryOn.init()` or `<TryOnWidget />`. */
export interface TryOnConfig {
  /** API key issued from the TryOn dashboard. */
  apiKey: string;

  /** Base URL of the API gateway. @default "https://api.tryon.dev/v1" */
  apiBaseUrl?: string;

  /** Garment to try on — either a garment ID or an image URL. */
  garment: GarmentInput;

  /** Theme overrides for the widget. */
  theme?: TryOnTheme;

  /** Callbacks for lifecycle events. */
  onResult?: (result: TryOnResult) => void;
  onError?: (error: TryOnError) => void;
  onClose?: () => void;
  onOpen?: () => void;
}

/** Garment input — either reference an existing garment or pass a raw image. */
export type GarmentInput =
  | { garmentId: string }
  | { imageUrl: string; type: GarmentType };

export type GarmentType = "TOP" | "BOTTOM" | "DRESS" | "OUTERWEAR" | "ACCESSORY";

/** CSS custom property overrides. */
export interface TryOnTheme {
  colorPrimary?: string;
  colorPrimaryHover?: string;
  colorSurface?: string;
  colorError?: string;
  borderRadius?: string;
  fontFamily?: string;
}

// ─── Results ─────────────────────────────────────────────────────────────────

/** Successful try-on result delivered via `onResult`. */
export interface TryOnResult {
  /** The generated try-on image URL (base64 data URL or hosted URL). */
  imageUrl: string;
  /** Unique job ID for reference. */
  jobId: string;
  /** Processing time in milliseconds. */
  processingTimeMs: number;
}

/** Error delivered via `onError`. */
export interface TryOnError {
  /** Machine-readable error code. */
  code: string;
  /** Human-readable message. */
  message: string;
}

// ─── Widget State ────────────────────────────────────────────────────────────

export type WidgetStep = "upload" | "processing" | "result" | "error";

export interface WidgetState {
  step: WidgetStep;
  isOpen: boolean;
  userImagePreview: string | null;
  result: TryOnResult | null;
  error: TryOnError | null;
}
