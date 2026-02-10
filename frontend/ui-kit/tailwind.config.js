/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  // Prefix all utility classes so they don't clash with host app styles
  prefix: "tryon-",
  theme: {
    extend: {
      colors: {
        // Semantic tokens — SDK consumers override these via CSS variables
        primary: "var(--tryon-color-primary, #6366f1)",
        "primary-hover": "var(--tryon-color-primary-hover, #4f46e5)",
        "primary-text": "var(--tryon-color-primary-text, #ffffff)",
        surface: "var(--tryon-color-surface, #ffffff)",
        "surface-alt": "var(--tryon-color-surface-alt, #f9fafb)",
        border: "var(--tryon-color-border, #e5e7eb)",
        "text-primary": "var(--tryon-color-text-primary, #111827)",
        "text-secondary": "var(--tryon-color-text-secondary, #6b7280)",
        error: "var(--tryon-color-error, #ef4444)",
        "error-bg": "var(--tryon-color-error-bg, #fef2f2)",
        "error-text": "var(--tryon-color-error-text, #991b1b)",
        overlay: "var(--tryon-color-overlay, rgba(0,0,0,0.5))",
      },
      borderRadius: {
        DEFAULT: "var(--tryon-radius, 0.5rem)",
        lg: "var(--tryon-radius-lg, 0.75rem)",
      },
      fontFamily: {
        sans: "var(--tryon-font-family, ui-sans-serif, system-ui, sans-serif)",
      },
    },
  },
  plugins: [],
};
