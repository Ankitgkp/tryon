export interface TryOnConfig {
  apiKey: string;

  apiBaseUrl?: string;
  garment: GarmentInput;
  theme?: TryOnTheme;
  onResult?: (result: TryOnResult) => void;
  onError?: (error: TryOnError) => void;
  onClose?: () => void;
  onOpen?: () => void;
  
export type GarmentInput =
  | { garmentId: string }
  | { imageUrl: string; type: GarmentType };

export type GarmentType = "TOP" | "BOTTOM" | "DRESS" | "OUTERWEAR" | "ACCESSORY";

export interface TryOnTheme {
  colorPrimary?: string;
  colorPrimaryHover?: string;
  colorSurface?: string;
  colorError?: string;
  borderRadius?: string;
  fontFamily?: string;
}

export interface TryOnResult {
  imageUrl: string;
  jobId: string;
  processingTimeMs: number;
}

export interface TryOnError {
  code: string;
  message: string;
}

export type WidgetStep = "upload" | "processing" | "result" | "error";

export interface WidgetState {
  step: WidgetStep;
  isOpen: boolean;
  userImagePreview: string | null;
  result: TryOnResult | null;
  error: TryOnError | null;
}
