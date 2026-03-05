# HTML Integration Guide

Add virtual try-on to any website with a single `<script>` tag. No build tools, no bundler, no npm required.

---

## Quick start

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Shop</title>

  <!-- 1. Load the widget CSS -->
  <link rel="stylesheet" href="https://cdn.tryon.dev/sdk/latest/widget-sdk.css" />
</head>
<body>
  <h1>Summer Collection — Linen Shirt</h1>
  <img src="/products/linen-shirt.jpg" alt="Linen Shirt" />

  <!-- 2. A container for the widget trigger (optional) -->
  <div id="tryon-container"></div>

  <!-- 3. Load the widget script -->
  <script src="https://cdn.tryon.dev/sdk/latest/tryon-widget.iife.js"></script>

  <!-- 4. Initialize -->
  <script>
    var widget = TryOn.init({
      apiKey: "tryon_abc12345_secret…",
      garment: { garmentId: "gmt_abc123" },
      container: "#tryon-container",
      triggerText: "Try it on",
      onResult: function (result) {
        console.log("Image URL:", result.imageUrl);
        console.log("Job ID:", result.jobId);
        console.log("Time:", result.processingTimeMs + "ms");
      },
      onError: function (error) {
        console.error("[" + error.code + "]", error.message);
      },
    });
  </script>
</body>
</html>
```

The IIFE bundle (~65 KB gzip) includes React — no external dependencies required.

---

## Self-hosting the bundle

Download the files from the CDN or copy them from the build output:

```
dist/
├── tryon-widget.iife.js    # Self-contained JS (209 KB, 65 KB gzip)
└── widget-sdk.css           # Styles (11 KB, 3 KB gzip)
```

Host them on your own CDN or static file server:

```html
<link rel="stylesheet" href="/assets/widget-sdk.css" />
<script src="/assets/tryon-widget.iife.js"></script>
```

---

## `TryOn.init(options)`

### Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `apiKey` | `string` |  | — | Your API key |
| `garment` | `object` |  | — | Garment to try on |
| `container` | `string \| HTMLElement` | | `document.body` | Mount target |
| `triggerText` | `string` | | `"Try On"` | Text for the trigger button |
| `apiBaseUrl` | `string` | | `https://api.tryon.dev/v1` | Custom API URL |
| `theme` | `object` | | — | Visual overrides |
| `onResult` | `function` | | — | `function(result)` — success callback |
| `onError` | `function` | | — | `function(error)` — error callback |
| `onOpen` | `function` | | — | Called when modal opens |
| `onClose` | `function` | | — | Called when modal closes |

### Garment input

```js
// Option A: Reference a garment by ID
{ garmentId: "gmt_abc123" }

// Option B: Pass a garment image URL + type
{ imageUrl: "https://shop.example.com/shirt.jpg", type: "TOP" }
```

Types: `"TOP"`, `"BOTTOM"`, `"DRESS"`, `"OUTERWEAR"`, `"ACCESSORY"`

### Return value — `TryOnInstance`

```js
var widget = TryOn.init({ /* options */ });

widget.open();    // Open the modal programmatically
widget.close();   // Close the modal
widget.destroy(); // Unmount the widget and clean up DOM
```

---

## Container options

### Mount into a specific element

```html
<div id="tryon-mount"></div>

<script>
  TryOn.init({
    apiKey: "tryon_abc12345_secret…",
    garment: { garmentId: "gmt_abc123" },
    container: "#tryon-mount",
  });
</script>
```

### Mount into a DOM element reference

```html
<script>
  var el = document.getElementById("product-actions");

  TryOn.init({
    apiKey: "tryon_abc12345_secret…",
    garment: { garmentId: "gmt_abc123" },
    container: el,
  });
</script>
```

### Floating (no container)

If you omit `container`, the widget creates a floating container appended to `<body>`:

```html
<script>
  TryOn.init({
    apiKey: "tryon_abc12345_secret…",
    garment: { garmentId: "gmt_abc123" },
    triggerText: "Virtual Try-On ",
  });
</script>
```

---

## Open programmatically

Skip the trigger button and open the modal from your own UI:

```html
<button onclick="openTryOn()">Try This On</button>

<script>
  var widget = TryOn.init({
    apiKey: "tryon_abc12345_secret…",
    garment: { garmentId: "gmt_abc123" },
  });

  function openTryOn() {
    widget.open();
  }
</script>
```

---

## Dynamic garment per product

Change the garment based on which product the user is viewing:

```html
<script>
  // Initialize once with a placeholder
  var widget = null;

  function showTryOn(garmentId) {
    // Destroy previous instance if any
    if (widget) widget.destroy();

    widget = TryOn.init({
      apiKey: "tryon_abc12345_secret…",
      garment: { garmentId: garmentId },
      container: "#tryon-mount",
      triggerText: "Try it on",
    });

    widget.open();
  }
</script>

<!-- Product cards -->
<div class="product" onclick="showTryOn('gmt_shirt_001')">
  <img src="/products/shirt.jpg" />
  <p>Blue Shirt — $49</p>
</div>

<div class="product" onclick="showTryOn('gmt_dress_002')">
  <img src="/products/dress.jpg" />
  <p>Summer Dress — $79</p>
</div>

<div id="tryon-mount"></div>
```

---

## Using a product image URL instead of garment ID

If you don't have garments in the TryOn catalog, pass the product image URL directly:

```html
<script>
  TryOn.init({
    apiKey: "tryon_abc12345_secret…",
    garment: {
      imageUrl: "https://shop.example.com/products/blue-shirt.jpg",
      type: "TOP",
    },
    container: "#tryon-mount",
  });
</script>
```

---

## Theming

Match the widget to your site's brand:

```html
<script>
  TryOn.init({
    apiKey: "tryon_abc12345_secret…",
    garment: { garmentId: "gmt_abc123" },
    theme: {
      colorPrimary: "#8B5CF6",
      colorPrimaryHover: "#7C3AED",
      colorSurface: "#1E1E2E",
      colorError: "#F43F5E",
      borderRadius: "12px",
      fontFamily: "'Inter', sans-serif",
    },
  });
</script>
```

Or override via CSS custom properties on any parent element:

```html
<style>
  :root {
    --tryon-color-primary: #8B5CF6;
    --tryon-color-primary-hover: #7C3AED;
    --tryon-color-surface: #FFFFFF;
    --tryon-color-error: #EF4444;
    --tryon-radius: 12px;
    --tryon-font-family: "Inter", sans-serif;
  }
</style>
```

---

## Handling results

### Display the result

```html
<img id="result-image" style="display: none;" />

<script>
  TryOn.init({
    apiKey: "tryon_abc12345_secret…",
    garment: { garmentId: "gmt_abc123" },
    onResult: function (result) {
      var img = document.getElementById("result-image");
      img.src = result.imageUrl;
      img.style.display = "block";
    },
  });
</script>
```

### Send to your backend

```js
onResult: function (result) {
  fetch("/api/save-tryon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageUrl: result.imageUrl,
      jobId: result.jobId,
    }),
  });
}
```

---

## Content Security Policy (CSP)

If your site uses a strict CSP, add these directives:

```
script-src 'self' https://cdn.tryon.dev;
style-src 'self' https://cdn.tryon.dev 'unsafe-inline';
connect-src 'self' https://api.tryon.dev;
img-src 'self' https://cdn.tryon.dev blob: data:;
```

If self-hosting the bundle, replace `https://cdn.tryon.dev` with your own domain.

The `blob:` and `data:` sources are required for image preview thumbnails.

---

## Browser support

| Browser | Minimum version |
|---------|-----------------|
| Chrome | 80+ |
| Firefox | 78+ |
| Safari | 14+ |
| Edge | 80+ |
| iOS Safari | 14+ |
| Chrome Android | 80+ |

The widget requires `fetch`, `FormData`, `URL.createObjectURL`, and ES2020 features.

---

## Cleanup

Always call `destroy()` when removing the widget from a single-page app or dynamic page:

```js
// When navigating away
widget.destroy();
```

This unmounts the React tree and removes the auto-created container element from the DOM.
