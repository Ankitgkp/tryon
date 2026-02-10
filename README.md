# TryOn — AI Virtual Try-On Platform

API-first SaaS platform for AI-based virtual clothing try-on. Upload a photo, pick a garment, get a photorealistic result in seconds.

## How it works

```
┌────────────────────────────────────────────────────────────────────┐
│  CLIENT (your site)                                                │
│                                                                    │
│  <TryOnWidget />  or  TryOn.init()  or  REST API calls            │
│       │                    │                   │                   │
└───────┼────────────────────┼───────────────────┼───────────────────┘
        │                    │                   │
        ▼                    ▼                   ▼
   ┌──────────────────────────────────────────────────┐
   │  API Gateway  (port 3000)                        │
   │  Auth (x-api-key) → Route → Response envelope    │
   └──────┬──────────┬──────────┬──────────┬──────────┘
          │          │          │          │
          ▼          ▼          ▼          ▼
   ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐
   │ Tenant   │ │ Image  │ │Garment │ │  Try-On      │
   │ Service  │ │Service │ │Service │ │ Orchestrator │
   │ :3001    │ │ :3002  │ │ :3003  │ │    :3004     │
   └──────────┘ └────────┘ └────────┘ └──────┬───────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │ AI Generation│
                                       │   Service    │
                                       │    :3005     │
                                       └──────────────┘
```

## Integration options

| Method | Target audience | Docs |
|--------|----------------|------|
| **React component** | React / Next.js apps | [React guide](docs/integration-react.md) |
| **`<script>` tag** | Any HTML page | [HTML guide](docs/integration-html.md) |
| **Shopify** | Shopify stores | [Shopify guide](docs/integration-shopify.md) |
| **WordPress** | WordPress / WooCommerce | [WordPress guide](docs/integration-wordpress.md) |
| **REST API** | Any backend or custom frontend | [API reference](docs/api-reference.md) |

## Quick start (React — 3 lines)

```tsx
import { TryOnWidget } from "@tryon/widget-sdk";
import "@tryon/widget-sdk/styles.css";

<TryOnWidget apiKey="tryon_abc_…" garment={{ garmentId: "gmt_123" }}>
  <button>Try it on</button>
</TryOnWidget>
```

## Quick start (any website — 1 `<script>` tag)

```html
<link rel="stylesheet" href="https://cdn.tryon.dev/sdk/latest/widget-sdk.css" />
<script src="https://cdn.tryon.dev/sdk/latest/tryon-widget.iife.js"></script>
<script>
  TryOn.init({
    apiKey: "tryon_abc_…",
    garment: { garmentId: "gmt_123" },
  });
</script>
```

## Documentation

- [REST API Reference](docs/api-reference.md) — endpoints, request/response shapes, error codes
- [React Integration](docs/integration-react.md) — component props, TypeScript types, Next.js SSR
- [HTML Integration](docs/integration-html.md) — script tag, vanilla JS, CSP headers
- [Shopify Embedding](docs/integration-shopify.md) — theme editor, Liquid snippets, Dawn theme
- [WordPress Embedding](docs/integration-wordpress.md) — shortcodes, Elementor, WooCommerce
- [Security & Privacy](docs/security-and-privacy.md) — key management, data handling, GDPR

## Monorepo structure

```
tryon/
├── frontend/
│   ├── ui-kit/             # Shared React component library (Button, Modal, etc.)
│   └── widget-sdk/         # Embeddable widget — React + vanilla JS + IIFE
├── packages/
│   ├── shared-types/       # TypeScript types shared across all services
│   ├── tsconfig/           # Shared TypeScript configurations
│   └── eslint-config/      # Shared ESLint configuration
└── services/
    ├── api-gateway/        # Public entry point — auth, routing, response envelope
    ├── tenant-service/     # API key management, domain allowlisting
    ├── image-service/      # Image upload, validation, temporary storage
    ├── garment-service/    # Garment catalog management
    ├── tryon-orchestrator/ # Try-on pipeline coordination
    └── ai-generation/      # AI model abstraction (OpenRouter, mock, etc.)
```

## Development

```bash
# Prerequisites
node --version  # v20+
pnpm --version  # v9+

# Install dependencies
pnpm install

# Build everything
pnpm -r build

# Build a specific package
pnpm --filter @tryon/widget-sdk build

# Type-check all packages
pnpm -r typecheck
```

## Tech stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20, TypeScript 5.9 |
| Backend framework | Fastify 5 |
| Frontend framework | React 19 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 3.4 (prefixed `tryon-`) |
| AI provider | OpenRouter (bytedance-seed/seedream-4.5) |
| Monorepo | pnpm workspaces |
| Package manager | pnpm 9 |

## License

Proprietary — all rights reserved.
