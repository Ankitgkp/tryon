# WordPress Integration Guide

Add virtual try-on to any WordPress site or WooCommerce store. No WordPress plugin required — just embed the script.

---

## Option A: Shortcode (recommended)

Add this to your theme's `functions.php` (or a site-specific plugin):

### `functions.php`

```php
<?php
/**
 * TryOn Virtual Try-On Widget
 *
 * Usage: [tryon_widget garment_id="gmt_abc123"]
 * Usage: [tryon_widget image_url="https://…/shirt.jpg" type="TOP"]
 */

// Enqueue the widget assets
function tryon_enqueue_scripts() {
    // Only load on pages that use the shortcode
    global $post;
    if (!is_a($post, 'WP_Post') || !has_shortcode($post->post_content, 'tryon_widget')) {
        return;
    }

    wp_enqueue_style(
        'tryon-widget-css',
        'https://cdn.tryon.dev/sdk/latest/widget-sdk.css',
        [],
        '1.0.0'
    );

    wp_enqueue_script(
        'tryon-widget-js',
        'https://cdn.tryon.dev/sdk/latest/tryon-widget.iife.js',
        [],
        '1.0.0',
        true // Load in footer
    );
}
add_action('wp_enqueue_scripts', 'tryon_enqueue_scripts');

// Register the shortcode
function tryon_widget_shortcode($atts) {
    $atts = shortcode_atts([
        'garment_id'   => '',
        'image_url'    => '',
        'type'         => 'TOP',
        'button_text'  => 'Virtual Try-On',
        'color'        => '#2563EB',
    ], $atts, 'tryon_widget');

    // Get API key from WordPress options
    $api_key = get_option('tryon_api_key', '');
    if (empty($api_key)) {
        return '<!-- TryOn: API key not configured -->';
    }

    // Build garment config
    if (!empty($atts['garment_id'])) {
        $garment_js = sprintf('{ garmentId: %s }', wp_json_encode($atts['garment_id']));
    } elseif (!empty($atts['image_url'])) {
        $garment_js = sprintf(
            '{ imageUrl: %s, type: %s }',
            wp_json_encode($atts['image_url']),
            wp_json_encode($atts['type'])
        );
    } else {
        return '<!-- TryOn: No garment_id or image_url provided -->';
    }

    $container_id = 'tryon-widget-' . wp_unique_id();

    ob_start();
    ?>
    <div id="<?php echo esc_attr($container_id); ?>" class="tryon-widget-wrapper"></div>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof TryOn === 'undefined') return;

        TryOn.init({
            apiKey: <?php echo wp_json_encode($api_key); ?>,
            garment: <?php echo $garment_js; ?>,
            container: '#<?php echo esc_js($container_id); ?>',
            triggerText: <?php echo wp_json_encode($atts['button_text']); ?>,
            theme: {
                colorPrimary: <?php echo wp_json_encode($atts['color']); ?>,
            },
        });
    });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('tryon_widget', 'tryon_widget_shortcode');

// Settings page for the API key
function tryon_register_settings() {
    register_setting('tryon_settings', 'tryon_api_key', [
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_text_field',
    ]);
}
add_action('admin_init', 'tryon_register_settings');

function tryon_settings_page() {
    add_options_page(
        'TryOn Settings',
        'TryOn',
        'manage_options',
        'tryon-settings',
        'tryon_render_settings_page'
    );
}
add_action('admin_menu', 'tryon_settings_page');

function tryon_render_settings_page() {
    ?>
    <div class="wrap">
        <h1>TryOn Virtual Try-On Settings</h1>
        <form method="post" action="options.php">
            <?php settings_fields('tryon_settings'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">API Key</th>
                    <td>
                        <input type="text"
                               name="tryon_api_key"
                               value="<?php echo esc_attr(get_option('tryon_api_key', '')); ?>"
                               class="regular-text"
                               placeholder="tryon_abc12345_secret…" />
                        <p class="description">
                            Get your API key from the
                            <a href="https://dashboard.tryon.dev" target="_blank">TryOn dashboard</a>.
                        </p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
```

### Usage in the editor

**With a garment ID:**

```
[tryon_widget garment_id="gmt_abc123"]
```

**With a product image URL:**

```
[tryon_widget image_url="https://shop.example.com/shirt.jpg" type="TOP"]
```

**With custom button text and color:**

```
[tryon_widget garment_id="gmt_abc123" button_text="Try This On ✨" color="#8B5CF6"]
```

---

## Option B: WooCommerce product pages

Automatically add a try-on button below the "Add to Cart" button for all products with a garment ID:

### `functions.php` — WooCommerce hooks

```php
<?php
/**
 * Auto-render TryOn widget on WooCommerce product pages.
 * 
 * Set the garment ID in a custom field named "tryon_garment_id".
 */

// Enqueue on product pages
function tryon_woo_enqueue_scripts() {
    if (!is_product()) return;

    wp_enqueue_style(
        'tryon-widget-css',
        'https://cdn.tryon.dev/sdk/latest/widget-sdk.css',
        [],
        '1.0.0'
    );

    wp_enqueue_script(
        'tryon-widget-js',
        'https://cdn.tryon.dev/sdk/latest/tryon-widget.iife.js',
        [],
        '1.0.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'tryon_woo_enqueue_scripts');

// Render after the Add to Cart button
function tryon_woo_after_add_to_cart() {
    global $product;

    $api_key = get_option('tryon_api_key', '');
    if (empty($api_key)) return;

    // Check for garment ID in product meta
    $garment_id = get_post_meta($product->get_id(), 'tryon_garment_id', true);

    if (!empty($garment_id)) {
        $garment_js = sprintf('{ garmentId: %s }', wp_json_encode($garment_id));
    } else {
        // Fall back to product image
        $image_url = wp_get_attachment_url($product->get_image_id());
        if (!$image_url) return;

        // Map WooCommerce category to garment type
        $categories = wp_get_post_terms($product->get_id(), 'product_cat', ['fields' => 'slugs']);
        $type = tryon_map_category($categories);

        $garment_js = sprintf(
            '{ imageUrl: %s, type: %s }',
            wp_json_encode($image_url),
            wp_json_encode($type)
        );
    }

    $container_id = 'tryon-woo-' . $product->get_id();
    ?>
    <div id="<?php echo esc_attr($container_id); ?>" style="margin-top: 15px;"></div>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof TryOn === 'undefined') return;

        TryOn.init({
            apiKey: <?php echo wp_json_encode($api_key); ?>,
            garment: <?php echo $garment_js; ?>,
            container: '#<?php echo esc_js($container_id); ?>',
            triggerText: 'Virtual Try-On',
            theme: {
                fontFamily: 'inherit',
            },
        });
    });
    </script>
    <?php
}
add_action('woocommerce_after_add_to_cart_button', 'tryon_woo_after_add_to_cart');

// Map WooCommerce category slugs to TryOn garment types
function tryon_map_category($categories) {
    $map = [
        'dresses'    => 'DRESS',
        'dress'      => 'DRESS',
        'pants'      => 'BOTTOM',
        'trousers'   => 'BOTTOM',
        'skirts'     => 'BOTTOM',
        'shorts'     => 'BOTTOM',
        'bottoms'    => 'BOTTOM',
        'jackets'    => 'OUTERWEAR',
        'coats'      => 'OUTERWEAR',
        'outerwear'  => 'OUTERWEAR',
    ];

    foreach ($categories as $cat) {
        $cat_lower = strtolower($cat);
        if (isset($map[$cat_lower])) {
            return $map[$cat_lower];
        }
    }

    return 'TOP'; // Default
}

// Add custom field to product editor
function tryon_woo_product_fields() {
    woocommerce_wp_text_input([
        'id'          => 'tryon_garment_id',
        'label'       => 'TryOn Garment ID',
        'description' => 'Enter the garment ID from your TryOn dashboard. Leave blank to use the product image.',
        'desc_tip'    => true,
    ]);
}
add_action('woocommerce_product_options_general_product_data', 'tryon_woo_product_fields');

// Save the custom field
function tryon_woo_save_product_fields($product_id) {
    if (isset($_POST['tryon_garment_id'])) {
        update_post_meta(
            $product_id,
            'tryon_garment_id',
            sanitize_text_field($_POST['tryon_garment_id'])
        );
    }
}
add_action('woocommerce_process_product_meta', 'tryon_woo_save_product_fields');
```

This adds:
- A **"TryOn Garment ID"** field in the product editor
- An automatic **"Virtual Try-On"** button below "Add to Cart" on all product pages

---

## Option C: Elementor

### Using an HTML widget

1. Drag an **HTML** widget onto your product page
2. Paste:

```html
<div id="tryon-elementor"></div>

<link rel="stylesheet" href="https://cdn.tryon.dev/sdk/latest/widget-sdk.css" />
<script src="https://cdn.tryon.dev/sdk/latest/tryon-widget.iife.js"></script>

<script>
document.addEventListener('DOMContentLoaded', function() {
  if (typeof TryOn === 'undefined') return;

  TryOn.init({
    apiKey: "tryon_abc12345_secret…",
    garment: { garmentId: "gmt_abc123" },
    container: "#tryon-elementor",
    triggerText: "Try it on",
  });
});
</script>
```

### Using dynamic tags (for WooCommerce products)

Replace the static garment ID with a dynamic product meta field:

```html
<script>
  // In Elementor, you can use dynamic tags in HTML widgets
  var garmentId = "<?php echo get_post_meta(get_the_ID(), 'tryon_garment_id', true); ?>";

  if (garmentId) {
    TryOn.init({
      apiKey: "tryon_abc12345_secret…",
      garment: { garmentId: garmentId },
      container: "#tryon-elementor",
    });
  }
</script>
```

---

## Option D: Block Editor (Gutenberg)

Use a **Custom HTML** block:

```html
<div id="tryon-gutenberg"></div>

<link rel="stylesheet" href="https://cdn.tryon.dev/sdk/latest/widget-sdk.css" />
<script src="https://cdn.tryon.dev/sdk/latest/tryon-widget.iife.js"></script>

<script>
document.addEventListener('DOMContentLoaded', function() {
  TryOn.init({
    apiKey: "tryon_abc12345_secret…",
    garment: { garmentId: "gmt_abc123" },
    container: "#tryon-gutenberg",
    triggerText: "Virtual Try-On ✨",
  });
});
</script>
```

---

## Self-hosting assets

Instead of loading from the CDN, host the files on your WordPress site:

1. Upload `tryon-widget.iife.js` and `widget-sdk.css` to your theme's directory or WordPress media library
2. Update the URLs in the `wp_enqueue_*` calls:

```php
wp_enqueue_style(
    'tryon-widget-css',
    get_template_directory_uri() . '/assets/widget-sdk.css',
    [],
    '1.0.0'
);

wp_enqueue_script(
    'tryon-widget-js',
    get_template_directory_uri() . '/assets/tryon-widget.iife.js',
    [],
    '1.0.0',
    true
);
```

---

## Domain allowlisting

Add your WordPress domain to the TryOn dashboard:

| Setting | Value |
|---------|-------|
| Allowed domains | `www.your-store.com`, `your-store.com` |

If you have staging environments, add those too: `staging.your-store.com`

---

## Troubleshooting

### Widget doesn't appear

1. Check that the API key is set under **Settings → TryOn**
2. Verify the product has a `tryon_garment_id` custom field (WooCommerce)
3. Open the browser console (F12) and look for errors

### Script blocked by security plugin

Some WordPress security plugins (Wordfence, Sucuri) may block inline scripts. Solutions:
- Add `https://cdn.tryon.dev` to your plugin's allowlist
- Self-host the widget files
- Use a nonce-based CSP approach

### Conflicts with other plugins

The TryOn widget's CSS is scoped with the `tryon-` prefix, so style conflicts are rare. If you experience JavaScript conflicts:
- Ensure the script loads with `defer`
- Initialize inside `DOMContentLoaded`
- Check for jQuery `noConflict` issues

### Caching plugins

If WP Super Cache, W3 Total Cache, or similar plugins are active, clear the cache after making changes. The widget scripts can be safely cached — they don't contain page-specific data.
