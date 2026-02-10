# Shopify Integration Guide

Add virtual try-on to your Shopify store. Works with all themes — Dawn, Debut, custom themes, and headless storefronts.

---

## Option A: Theme editor (no code)

### Step 1 — Upload the widget files

1. In your Shopify admin, go to **Online Store → Themes → Edit code**
2. Under **Assets**, click **Add a new asset**
3. Upload two files:
   - `tryon-widget.iife.js` (download from your TryOn dashboard)
   - `widget-sdk.css` (download from your TryOn dashboard)

### Step 2 — Create a snippet

1. Under **Snippets**, click **Add a new snippet**
2. Name it `tryon-widget`
3. Paste this code:

```liquid
{% comment %}
  TryOn Virtual Try-On Widget
  Usage: {% render 'tryon-widget', garment_id: product.metafields.tryon.garment_id %}
{% endcomment %}

{% if garment_id != blank %}
<div id="tryon-widget-{{ product.id }}"></div>

{{ 'widget-sdk.css' | asset_url | stylesheet_tag }}
<script src="{{ 'tryon-widget.iife.js' | asset_url }}" defer></script>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof TryOn === 'undefined') return;

    TryOn.init({
      apiKey: '{{ settings.tryon_api_key }}',
      garment: { garmentId: '{{ garment_id }}' },
      container: '#tryon-widget-{{ product.id }}',
      triggerText: 'Try it on',
      theme: {
        colorPrimary: '{{ settings.tryon_color | default: "#2563EB" }}',
        borderRadius: '{{ settings.tryon_radius | default: "8px" }}',
        fontFamily: '{{ settings.type_body_font.family }}, sans-serif',
      },
      onResult: function(result) {
        // Optional: track conversion
        if (window.Shopify && window.Shopify.analytics) {
          Shopify.analytics.publish('tryon_completed', {
            productId: '{{ product.id }}',
            variantId: '{{ product.selected_or_first_available_variant.id }}',
          });
        }
      },
    });
  });
</script>
{% endif %}
```

### Step 3 — Add theme settings

In `config/settings_schema.json`, add a settings section (or add to an existing one):

```json
{
  "name": "Virtual Try-On",
  "settings": [
    {
      "type": "text",
      "id": "tryon_api_key",
      "label": "TryOn API Key",
      "info": "Get your API key from the [TryOn dashboard](https://dashboard.tryon.dev)"
    },
    {
      "type": "color",
      "id": "tryon_color",
      "label": "Widget accent color",
      "default": "#2563EB"
    },
    {
      "type": "text",
      "id": "tryon_radius",
      "label": "Widget border radius",
      "default": "8px"
    }
  ]
}
```

### Step 4 — Render on product pages

In your product template (e.g., `sections/main-product.liquid` or `templates/product.liquid`), add:

```liquid
{% render 'tryon-widget', garment_id: product.metafields.tryon.garment_id %}
```

### Step 5 — Add garment IDs to products

For each product with try-on support:

1. Go to **Products → [Product Name]**
2. Scroll to **Metafields**
3. Add a metafield with namespace `tryon`, key `garment_id`, value = your garment ID (e.g., `gmt_abc123`)

> **Tip**: Use the Shopify Bulk Editor to add garment IDs to many products at once.

---

## Option B: Use the product image URL (no garment catalog)

If you don't want to manage a garment catalog, pass the product's featured image directly:

```liquid
{% comment %} tryon-widget-auto.liquid {% endcomment %}

{% assign supported_types = "tops,shirts,blouses,t-shirts,dresses,jackets,coats,pants,skirts" | split: "," %}
{% assign product_type_lower = product.type | downcase %}
{% assign show_tryon = false %}

{% for type in supported_types %}
  {% if product_type_lower contains type %}
    {% assign show_tryon = true %}
    {% break %}
  {% endif %}
{% endfor %}

{% if show_tryon %}
  {% comment %} Map Shopify product type to TryOn garment type {% endcomment %}
  {% assign garment_type = "TOP" %}
  {% if product_type_lower contains "dress" %}
    {% assign garment_type = "DRESS" %}
  {% elsif product_type_lower contains "pant" or product_type_lower contains "skirt" %}
    {% assign garment_type = "BOTTOM" %}
  {% elsif product_type_lower contains "jacket" or product_type_lower contains "coat" %}
    {% assign garment_type = "OUTERWEAR" %}
  {% endif %}

  <div id="tryon-widget-{{ product.id }}"></div>

  {{ 'widget-sdk.css' | asset_url | stylesheet_tag }}
  <script src="{{ 'tryon-widget.iife.js' | asset_url }}" defer></script>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      if (typeof TryOn === 'undefined') return;

      TryOn.init({
        apiKey: '{{ settings.tryon_api_key }}',
        garment: {
          imageUrl: '{{ product.featured_image | image_url: width: 1024 }}',
          type: '{{ garment_type }}',
        },
        container: '#tryon-widget-{{ product.id }}',
        triggerText: 'Virtual Try-On',
      });
    });
  </script>
{% endif %}
```

---

## Option C: Dawn theme (App Blocks)

If you're using Shopify's Dawn theme (or any Online Store 2.0 theme), you can create an app block:

### `blocks/tryon-widget.liquid`

```liquid
{% schema %}
{
  "name": "Virtual Try-On",
  "target": "section",
  "settings": [
    {
      "type": "text",
      "id": "trigger_text",
      "label": "Button text",
      "default": "Try it on"
    }
  ]
}
{% endschema %}

<div id="tryon-block-{{ block.id }}" {{ block.shopify_attributes }}>
  {{ 'widget-sdk.css' | asset_url | stylesheet_tag }}
  <script src="{{ 'tryon-widget.iife.js' | asset_url }}" defer></script>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      if (typeof TryOn === 'undefined') return;

      var garmentId = '{{ product.metafields.tryon.garment_id }}';
      var garment = garmentId
        ? { garmentId: garmentId }
        : {
            imageUrl: '{{ product.featured_image | image_url: width: 1024 }}',
            type: 'TOP',
          };

      TryOn.init({
        apiKey: '{{ settings.tryon_api_key }}',
        garment: garment,
        container: '#tryon-block-{{ block.id }}',
        triggerText: '{{ block.settings.trigger_text }}',
      });
    });
  </script>
</div>
```

---

## Option D: Headless Shopify (Hydrogen / custom storefront)

If you're using Hydrogen or a headless React storefront, use the React integration:

```tsx
// app/components/TryOnButton.tsx
import { TryOnWidget } from "@tryon/widget-sdk";
import "@tryon/widget-sdk/styles.css";

export function TryOnButton({
  garmentId,
  productImageUrl,
  productType,
}: {
  garmentId?: string;
  productImageUrl: string;
  productType: string;
}) {
  const garment = garmentId
    ? { garmentId }
    : { imageUrl: productImageUrl, type: mapProductType(productType) };

  return (
    <TryOnWidget
      apiKey={import.meta.env.PUBLIC_TRYON_API_KEY}
      garment={garment}
    >
      <button className="try-on-btn">Virtual Try-On</button>
    </TryOnWidget>
  );
}

function mapProductType(shopifyType: string) {
  const t = shopifyType.toLowerCase();
  if (t.includes("dress")) return "DRESS";
  if (t.includes("pant") || t.includes("skirt")) return "BOTTOM";
  if (t.includes("jacket") || t.includes("coat")) return "OUTERWEAR";
  return "TOP";
}
```

---

## Styling the trigger button

### Match Shopify's default button style

```liquid
<style>
  #tryon-widget-{{ product.id }} button {
    background-color: {{ settings.tryon_color | default: "var(--color-button)" }};
    color: var(--color-button-text);
    border: none;
    padding: 10px 20px;
    font-size: var(--font-body-size);
    font-family: var(--font-body-family);
    cursor: pointer;
    border-radius: var(--buttons-radius);
    width: 100%;
    margin-top: 10px;
  }
</style>
```

---

## Domain allowlisting

For security, configure your store's domain in the TryOn dashboard:

| Setting | Value |
|---------|-------|
| Allowed domains | `your-store.myshopify.com`, `your-custom-domain.com` |
| Wildcard | `*.myshopify.com` (if you have multiple stores) |

This prevents your API key from being used on other websites.

---

## Troubleshooting

### Widget doesn't appear

- Verify the API key is set in **Theme Settings → Virtual Try-On**
- Check that the product has a `tryon.garment_id` metafield (or use the product-image approach)
- Open the browser console for errors — look for `TryOn:` prefixed messages

### "Container not found" error

- Make sure the container element exists before the script runs
- Use `defer` on the script tag and initialize inside `DOMContentLoaded`

### CSP errors

Add to your theme's CSP headers (via Shopify app or `Content-Security-Policy` meta tag):

```
script-src 'self' 'unsafe-inline';
connect-src 'self' https://api.tryon.dev;
img-src 'self' blob: data: https://cdn.tryon.dev;
```

### Multiple products on a collection page

Each widget needs a unique container ID. Use `product.id` in the container selector:

```liquid
{% for product in collection.products %}
  <div id="tryon-widget-{{ product.id }}"></div>
  <script>
    TryOn.init({
      apiKey: '{{ settings.tryon_api_key }}',
      garment: { garmentId: '{{ product.metafields.tryon.garment_id }}' },
      container: '#tryon-widget-{{ product.id }}',
    });
  </script>
{% endfor %}
```
