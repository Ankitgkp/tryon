# @tryon/widget-sdk

Embeddable virtual try-on widget. Drop it into any website — via a React component or a `<script>` tag.

## Features

- **Two integration modes** — React component (ESM) and vanilla JS (IIFE `<script>` tag)
- **4-step flow** — Upload → Processing → Result → Error recovery
- **Fully themed** — Override colors, fonts, and radii via CSS custom properties
- **Accessible** — Keyboard navigation, ARIA labels, focus management
- **Isolated styles** — All Tailwind classes prefixed with `tryon-` to avoid collisions

## Installation

### React (npm / pnpm)

```bash
pnpm add @tryon/widget-sdk
# or
npm install @tryon/widget-sdk
```

> `react` and `react-dom` (^18 or ^19) are peer dependencies.

### Script Tag (CDN / self-hosted)

```html
<link rel="stylesheet" href="path/to/widget-sdk.css" />
<script src="path/to/tryon-widget.iife.js"></script>
```

The IIFE bundle (~65 KB gzip) includes React — no external dependencies required.

## Quick Start

### React

```tsx
import { TryOnWidget } from "@tryon/widget-sdk";
import "@tryon/widget-sdk/styles.css";

function ProductPage() {
  return (
    <TryOnWidget
      apiKey="your-api-key"
      garment={{ garmentId: "gmt_abc123" }}
      onResult={(result) => console.log("Generated:", result.imageUrl)}
      onError={(err) => console.error(err.code, err.message)}
    >
      <button>Try it on</button>
    </TryOnWidget>
  );
}
```

Clicking the child element opens the modal. Pass `open` to control it externally.

### Vanilla JS

```html
<link rel="stylesheet" href="tryon-widget.css" />
<script src="tryon-widget.iife.js"></script>
<script>
  const widget = TryOn.init({
    apiKey: "your-api-key",
    garment: { garmentId: "gmt_abc123" },
    triggerText: "Try it on",
    onResult: (result) => console.log("Generated:", result.imageUrl),
    onError: (err) => console.error(err.code, err.message),
  });

  // Programmatic control
  widget.open();
  widget.close();
  widget.destroy(); // clean up when done
</script>
```

## API Reference

### `TryOnConfig`

| Property       | Type                               | Required | Description                              |
| -------------- | ---------------------------------- | -------- | ---------------------------------------- |
| `apiKey`       | `string`                           | ✅       | API key from the TryOn dashboard         |
| `apiBaseUrl`   | `string`                           |          | Gateway URL (default `https://api.tryon.dev/v1`) |
| `garment`      | `GarmentInput`                     | ✅       | Garment to try on (see below)            |
| `theme`        | `TryOnTheme`                       |          | CSS custom property overrides            |
| `onResult`     | `(result: TryOnResult) => void`    |          | Called on successful generation          |
| `onError`      | `(error: TryOnError) => void`      |          | Called on any error                      |
| `onClose`      | `() => void`                       |          | Called when the modal closes             |
| `onOpen`       | `() => void`                       |          | Called when the modal opens              |

### `GarmentInput`

A discriminated union — provide **one** of:

```ts
// Reference an existing garment by ID
{ garmentId: "gmt_abc123" }

// Or pass a raw image URL + type
{ imageUrl: "https://…/shirt.jpg", type: "TOP" }
```

Supported garment types: `TOP`, `BOTTOM`, `DRESS`, `OUTERWEAR`, `ACCESSORY`.

### `TryOnResult`

```ts
{
  imageUrl: string;        // Generated try-on image URL
  jobId: string;           // Job ID for reference
  processingTimeMs: number // Processing time in ms
}
```

### `TryOnError`

```ts
{
  code: string;    // Machine-readable: "FILE_VALIDATION", "GENERATION_FAILED", "TIMEOUT", etc.
  message: string; // Human-readable description
}
```

### Vanilla JS — `TryOn.init(options)`

Accepts everything from `TryOnConfig` plus:

| Property      | Type                    | Description                                      |
| ------------- | ----------------------- | ------------------------------------------------ |
| `container`   | `string \| HTMLElement` | CSS selector or element to mount into (optional)  |
| `triggerText` | `string`                | Text for the auto-generated trigger button        |

Returns a `TryOnInstance`:

```ts
{
  open(): void;    // Open the modal
  close(): void;   // Close the modal
  destroy(): void; // Unmount and clean up
}
```

## Theming

Override any design token via the `theme` prop or CSS custom properties:

```tsx
<TryOnWidget
  theme={{
    colorPrimary: "#8B5CF6",
    colorPrimaryHover: "#7C3AED",
    colorSurface: "#1E1E2E",
    colorError: "#F43F5E",
    borderRadius: "12px",
    fontFamily: "'Inter', sans-serif",
  }}
  // …
/>
```

Or set them globally in CSS:

```css
:root {
  --tryon-color-primary: #8B5CF6;
  --tryon-color-primary-hover: #7C3AED;
  --tryon-color-surface: #1E1E2E;
  --tryon-color-error: #F43F5E;
  --tryon-radius: 12px;
  --tryon-font-family: "Inter", sans-serif;
}
```

## Build Outputs

| Output                    | Format | React Bundled | Use Case                     |
| ------------------------- | ------ | ------------- | ---------------------------- |
| `dist/index.js`           | ESM    | ❌ (external) | React apps via bundler       |
| `dist/vanilla.js`         | ESM    | ❌ (external) | Advanced ESM vanilla usage   |
| `dist/tryon-widget.iife.js` | IIFE | ✅ (~65 KB gz) | `<script>` tag, any website |
| `dist/widget-sdk.css`     | CSS    | —             | Required for all modes       |

## Development

```bash
# Build everything
pnpm --filter @tryon/widget-sdk build

# Build individual targets
pnpm --filter @tryon/widget-sdk build:esm
pnpm --filter @tryon/widget-sdk build:iife

# Type-check
pnpm --filter @tryon/widget-sdk typecheck

# Lint
pnpm --filter @tryon/widget-sdk lint
```

## Architecture

```
src/
├── index.ts          # React entry — exports TryOnWidget + types
├── vanilla.ts        # Vanilla entry — window.TryOn.init()
├── TryOnWidget.tsx   # Main React component (4-step flow)
├── api-client.ts     # TryOnApiClient — upload, create, poll
├── theme.ts          # CSS custom property applicator
├── types.ts          # Public SDK types (stable contract)
└── styles.css        # Tailwind directives + custom properties
```
