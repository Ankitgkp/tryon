# @tryon/ui-kit

Themeable, reusable React UI component library for TryOn SDKs.

> **This library is consumed by SDKs, not end-users directly.**

## Installation

```bash
pnpm add @tryon/ui-kit
```

## Usage

```tsx
// Import styles once at your app's entry point
import "@tryon/ui-kit/styles.css";

// Import components
import { Button, Modal, ImageUploader, Loader, ErrorState } from "@tryon/ui-kit";
```

## Components

### Button

A multi-variant, multi-size button with loading state support.

| Prop        | Type                                          | Default     | Description                     |
| ----------- | --------------------------------------------- | ----------- | ------------------------------- |
| `variant`   | `"primary" \| "secondary" \| "ghost" \| "danger"` | `"primary"` | Visual style                    |
| `size`      | `"sm" \| "md" \| "lg"`                        | `"md"`      | Size preset                     |
| `loading`   | `boolean`                                     | `false`     | Show spinner, disable clicks    |
| `fullWidth` | `boolean`                                     | `false`     | Stretch to container width      |

Forwards refs and spreads all native `<button>` attributes.

```tsx
<Button variant="primary" size="md" onClick={handleClick}>Submit</Button>
<Button variant="secondary" loading>Processing…</Button>
```

---

### Modal

An accessible modal dialog with Escape/overlay-click dismissal.

| Prop                  | Type        | Default | Description                     |
| --------------------- | ----------- | ------- | ------------------------------- |
| `open`                | `boolean`   | —       | Whether the modal is visible    |
| `onClose`             | `() => void`| —       | Close callback                  |
| `title`               | `string`    | —       | Optional header title           |
| `children`            | `ReactNode` | —       | Modal body content              |
| `footer`              | `ReactNode` | —       | Optional footer (action buttons)|
| `closeOnOverlayClick` | `boolean`   | `true`  | Close when clicking overlay     |
| `closeOnEscape`       | `boolean`   | `true`  | Close when pressing Escape      |
| `showCloseButton`     | `boolean`   | `true`  | Show the × button               |

```tsx
<Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm">
  <p>Are you sure?</p>
</Modal>
```

---

### ImageUploader

A drag-and-drop image upload zone with file validation. No upload logic — the SDK handles that.

| Prop            | Type                              | Default                            | Description                    |
| --------------- | --------------------------------- | ---------------------------------- | ------------------------------ |
| `onFileSelect`  | `(file: SelectedFile) => void`    | —                                  | Called with valid file + preview|
| `onError`       | `(message: string) => void`       | —                                  | Called on validation failure    |
| `acceptedTypes` | `string[]`                        | `["image/jpeg","image/png","image/webp"]` | Accepted MIME types    |
| `maxSizeBytes`  | `number`                          | `10485760` (10 MB)                 | Max file size in bytes         |
| `label`         | `string`                          | `"Drag & drop an image, or…"`     | Drop zone label text           |
| `disabled`      | `boolean`                         | `false`                            | Disable interaction            |

```tsx
<ImageUploader
  onFileSelect={({ file, previewUrl }) => handleFile(file)}
  onError={(msg) => setError(msg)}
  maxSizeBytes={5 * 1024 * 1024}
/>
```

---

### Loader

An animated spinner with accessible labeling.

| Prop    | Type                          | Default      | Description              |
| ------- | ----------------------------- | ------------ | ------------------------ |
| `size`  | `"sm" \| "md" \| "lg"`       | `"md"`       | Spinner size             |
| `label` | `string`                      | `"Loading"`  | Accessible status label  |

```tsx
<Loader size="lg" label="Generating image…" />
```

---

### ErrorState

A styled error display with icon, message, description, and action slot.

| Prop          | Type        | Default           | Description                     |
| ------------- | ----------- | ----------------- | ------------------------------- |
| `message`     | `string`    | —                 | Primary error message           |
| `description` | `string`    | —                 | Optional detailed guidance      |
| `action`      | `ReactNode` | —                 | Optional action (retry button)  |
| `icon`        | `ReactNode` | exclamation icon  | Optional custom icon            |

```tsx
<ErrorState
  message="Image generation failed"
  description="Please try again."
  action={<Button variant="secondary" onClick={retry}>Retry</Button>}
/>
```

## Theming

All components are themed via CSS custom properties. Override them anywhere in your app:

```css
:root {
  --tryon-color-primary: #0ea5e9;
  --tryon-color-primary-hover: #0284c7;
  --tryon-color-primary-text: #ffffff;
  --tryon-color-surface: #ffffff;
  --tryon-color-surface-alt: #f9fafb;
  --tryon-color-border: #e5e7eb;
  --tryon-color-text-primary: #111827;
  --tryon-color-text-secondary: #6b7280;
  --tryon-color-error: #ef4444;
  --tryon-color-error-bg: #fef2f2;
  --tryon-color-error-text: #991b1b;
  --tryon-color-overlay: rgba(0, 0, 0, 0.5);
  --tryon-radius: 0.5rem;
  --tryon-radius-lg: 0.75rem;
  --tryon-font-family: ui-sans-serif, system-ui, sans-serif;
}
```

All Tailwind utility classes are prefixed with `tryon-` to prevent collisions with host app styles.

## Build

```bash
pnpm --filter @tryon/ui-kit build
```

Output: `dist/index.js` (ESM), `dist/index.d.ts` (types), `dist/styles.css` (Tailwind).
