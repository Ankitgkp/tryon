/**
 * @tryon/widget-sdk — React entry point.
 *
 * Usage:
 *   import { TryOnWidget } from "@tryon/widget-sdk";
 *   import "@tryon/widget-sdk/styles.css";
 *
 *   <TryOnWidget
 *     apiKey="your-api-key"
 *     garment={{ garmentId: "gmt_123" }}
 *     onResult={(r) => console.log(r)}
 *   >
 *     <button>Try On</button>
 *   </TryOnWidget>
 */

export { TryOnWidget } from "./TryOnWidget";
export type { TryOnWidgetProps } from "./TryOnWidget";

export type {
  TryOnConfig,
  TryOnResult,
  TryOnError,
  TryOnTheme,
  GarmentInput,
  GarmentType,
  WidgetStep,
  WidgetState,
} from "./types";
