# React Integration Guide

Add virtual try-on to any React or Next.js application with the `<TryOnWidget />` component.

---

## Installation

```bash
pnpm add @tryon/widget-sdk
# or
npm install @tryon/widget-sdk
```

> Peer dependencies: `react` and `react-dom` (^18.0.0 or ^19.0.0)

---

## Basic usage

```tsx
import { TryOnWidget } from "@tryon/widget-sdk";
import "@tryon/widget-sdk/styles.css";

function ProductPage() {
  return (
    <TryOnWidget
      apiKey="tryon_abc12345_secret…"
      garment={{ garmentId: "gmt_abc123" }}
      onResult={(result) => {
        console.log("Generated image:", result.imageUrl);
        console.log("Processing time:", result.processingTimeMs, "ms");
      }}
      onError={(error) => {
        console.error(`[${error.code}] ${error.message}`);
      }}
    >
      <button className="try-on-button">Try it on</button>
    </TryOnWidget>
  );
}
```

Clicking the child element opens a modal with the full try-on flow: upload → processing → result.

---

## Props

### `TryOnWidgetProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `apiKey` | `string` | — | Your API key from the TryOn dashboard |
| `garment` | `GarmentInput`  — | Garment to try on (see below) |
| `apiBaseUrl` | `string` | | `https://api.tryon.dev/v1` | Custom API gateway URL |
| `theme` | `TryOnTheme` | | — | Visual customization (see [Theming](#theming)) |
| `open` | `boolean` | | — | Control modal open state externally |
| `onResult` | `(result: TryOnResult) => void` | | — | Called when generation succeeds |
| `onError` | `(error: TryOnError) => void` | | — | Called when an error occurs |
| `onOpen` | `() => void` | | — | Called when the modal opens |
| `onClose` | `() => void` | | — | Called when the modal closes |
| `children` | `ReactNode` | | — | Trigger element — click to open modal |

### `GarmentInput`

Provide **one** of these shapes:

```ts
// Reference a garment from your catalog
{ garmentId: "gmt_abc123" }

// Or pass a garment image URL directly
{ imageUrl: "https://shop.example.com/shirt.jpg", type: "TOP" }
```

| Garment type | Description |
|--------------|-------------|
| `TOP` | T-shirts, shirts, blouses, sweaters |
| `BOTTOM` | Pants, skirts, shorts |
| `DRESS` | Dresses, jumpsuits |
| `OUTERWEAR` | Jackets, coats |
| `ACCESSORY` | Hats, scarves, bags |

### `TryOnResult`

```ts
interface TryOnResult {
  imageUrl: string;        // URL of the generated try-on image
  jobId: string;           // Unique job ID for support reference
  processingTimeMs: number // How long generation took
}
```

### `TryOnError`

```ts
interface TryOnError {
  code: string;    // Machine-readable: "FILE_VALIDATION", "GENERATION_FAILED", "TIMEOUT", etc.
  message: string; // Human-readable description
}
```

---

## Controlled mode

Use the `open` prop to control the modal programmatically:

```tsx
import { useState } from "react";
import { TryOnWidget } from "@tryon/widget-sdk";
import "@tryon/widget-sdk/styles.css";

function ProductPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Virtual Try-On
      </button>

      <TryOnWidget
        apiKey="tryon_abc12345_secret…"
        garment={{ garmentId: "gmt_abc123" }}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onOpen={() => setIsOpen(true)}
        onResult={(result) => {
          console.log("Result:", result.imageUrl);
          // Optionally close automatically after result
          // setIsOpen(false);
        }}
      />
    </>
  );
}
```

---

## Dynamic garment from product page

Bind the garment prop to your product data:

```tsx
import { TryOnWidget } from "@tryon/widget-sdk";
import "@tryon/widget-sdk/styles.css";

interface Product {
  id: string;
  name: string;
  garmentId: string;       // Mapped to TryOn garment catalog
  imageUrl: string;
  category: "TOP" | "BOTTOM" | "DRESS" | "OUTERWEAR" | "ACCESSORY";
}

function ProductCard({ product }: { product: Product }) {
  // Option A: Use garment ID from your catalog
  const garmentById = { garmentId: product.garmentId };

  // Option B: Use the product image URL directly
  const garmentByUrl = { imageUrl: product.imageUrl, type: product.category };

  return (
    <div className="product-card">
      <img src={product.imageUrl} alt={product.name} />
      <h2>{product.name}</h2>

      <TryOnWidget
        apiKey={process.env.NEXT_PUBLIC_TRYON_API_KEY!}
        garment={garmentById}
        onResult={(result) => {
          // Track conversion
          analytics.track("tryon_completed", {
            productId: product.id,
            processingTime: result.processingTimeMs,
          });
        }}
      >
        <button className="btn btn-primary">Try it on</button>
      </TryOnWidget>
    </div>
  );
}
```

---

## Theming

Customize the widget appearance to match your brand:

```tsx
<TryOnWidget
  apiKey="tryon_abc12345_secret…"
  garment={{ garmentId: "gmt_abc123" }}
  theme={{
    colorPrimary: "#8B5CF6",       // Primary button & accent color
    colorPrimaryHover: "#7C3AED",  // Primary button hover state
    colorSurface: "#FFFFFF",       // Modal background color
    colorError: "#EF4444",         // Error state color
    borderRadius: "12px",          // Border radius for cards & buttons
    fontFamily: "'Inter', sans-serif",
  }}
>
  <button>Try it on</button>
</TryOnWidget>
```

### Available theme tokens

| Token | CSS Custom Property | Default |
|-------|-------------------|---------|
| `colorPrimary` | `--tryon-color-primary` | `#2563EB` |
| `colorPrimaryHover` | `--tryon-color-primary-hover` | `#1D4ED8` |
| `colorSurface` | `--tryon-color-surface` | `#FFFFFF` |
| `colorError` | `--tryon-color-error` | `#EF4444` |
| `borderRadius` | `--tryon-radius` | `8px` |
| `fontFamily` | `--tryon-font-family` | `system-ui, sans-serif` |

You can also set these globally in your CSS:

```css
:root {
  --tryon-color-primary: #8B5CF6;
  --tryon-color-primary-hover: #7C3AED;
  --tryon-font-family: "Inter", sans-serif;
}
```

---

## Next.js integration

### App Router (Next.js 13+)

The widget uses browser APIs (`File`, `FormData`, `URL.createObjectURL`), so it must be rendered client-side:

```tsx
// app/products/[id]/page.tsx
import { TryOnButton } from "./TryOnButton";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);

  return (
    <main>
      <h1>{product.name}</h1>
      <img src={product.imageUrl} alt={product.name} />
      <TryOnButton garmentId={product.garmentId} />
    </main>
  );
}
```

```tsx
// app/products/[id]/TryOnButton.tsx
"use client";

import { TryOnWidget } from "@tryon/widget-sdk";
import "@tryon/widget-sdk/styles.css";

export function TryOnButton({ garmentId }: { garmentId: string }) {
  return (
    <TryOnWidget
      apiKey={process.env.NEXT_PUBLIC_TRYON_API_KEY!}
      garment={{ garmentId }}
      onResult={(result) => console.log(result.imageUrl)}
    >
      <button className="rounded bg-indigo-600 px-4 py-2 text-white">
        Virtual Try-On
      </button>
    </TryOnWidget>
  );
}
```

### Pages Router

```tsx
// pages/products/[id].tsx
import dynamic from "next/dynamic";

const TryOnWidget = dynamic(
  () => import("@tryon/widget-sdk").then((m) => m.TryOnWidget),
  { ssr: false }
);

export default function ProductPage({ product }) {
  return (
    <TryOnWidget
      apiKey={process.env.NEXT_PUBLIC_TRYON_API_KEY!}
      garment={{ garmentId: product.garmentId }}
    >
      <button>Try it on</button>
    </TryOnWidget>
  );
}
```

> **Important**: Import the CSS in `_app.tsx` instead:
> ```tsx
> // pages/_app.tsx
> import "@tryon/widget-sdk/styles.css";
> ```

---

## Handling results

### Save to gallery

```tsx
<TryOnWidget
  apiKey="tryon_abc12345_secret…"
  garment={{ garmentId: "gmt_abc123" }}
  onResult={(result) => {
    // Save to your backend
    fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: result.imageUrl,
        jobId: result.jobId,
      }),
    });
  }}
>
  <button>Try it on</button>
</TryOnWidget>
```

### Download the result

```tsx
onResult={(result) => {
  const link = document.createElement("a");
  link.href = result.imageUrl;
  link.download = `tryon-${result.jobId}.png`;
  link.click();
}}
```

### Share on social media

```tsx
onResult={(result) => {
  if (navigator.share) {
    navigator.share({
      title: "My virtual try-on",
      url: result.imageUrl,
    });
  }
}}
```

---

## Error handling

```tsx
<TryOnWidget
  apiKey="tryon_abc12345_secret…"
  garment={{ garmentId: "gmt_abc123" }}
  onError={(error) => {
    switch (error.code) {
      case "FILE_VALIDATION":
        // User uploaded an invalid file (wrong type, too large, etc.)
        toast.warning(error.message);
        break;
      case "GENERATION_FAILED":
        // AI model failed — retry is possible
        toast.error("Generation failed. Please try a different photo.");
        break;
      case "TIMEOUT":
        // Job took too long — retry is possible
        toast.error("Request timed out. Please try again.");
        break;
      case "INVALID_API_KEY":
        // Configuration issue — log to monitoring
        console.error("Invalid API key configuration");
        break;
      default:
        toast.error(error.message);
    }
  }}
>
  <button>Try it on</button>
</TryOnWidget>
```

---

## TypeScript

All types are exported from the package:

```tsx
import type {
  TryOnWidgetProps,
  TryOnConfig,
  TryOnResult,
  TryOnError,
  TryOnTheme,
  GarmentInput,
  GarmentType,
  WidgetStep,
  WidgetState,
} from "@tryon/widget-sdk";
```\
