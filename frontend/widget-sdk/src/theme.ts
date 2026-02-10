/**
 * Theme utility.
 *
 * Converts a TryOnTheme object into CSS custom property assignments
 * on a container element, so the ui-kit components pick them up.
 */

import type { TryOnTheme } from "./types";

const THEME_MAP: Record<keyof TryOnTheme, string> = {
  colorPrimary: "--tryon-color-primary",
  colorPrimaryHover: "--tryon-color-primary-hover",
  colorSurface: "--tryon-color-surface",
  colorError: "--tryon-color-error",
  borderRadius: "--tryon-radius",
  fontFamily: "--tryon-font-family",
};

/** Apply theme overrides as CSS custom properties on a DOM element. */
export function applyTheme(
  element: HTMLElement,
  theme: TryOnTheme | undefined,
): void {
  if (!theme) return;

  for (const [key, cssVar] of Object.entries(THEME_MAP)) {
    const value = theme[key as keyof TryOnTheme];
    if (value) {
      element.style.setProperty(cssVar, value);
    }
  }
}
