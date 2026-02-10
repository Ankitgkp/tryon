/**
 * @tryon/widget-sdk — Vanilla JS entry point.
 *
 * This file provides `window.TryOn.init()` for script-tag integration.
 * It renders the React widget into a dynamically created container.
 *
 * Usage:
 *   <script src="https://cdn.tryon.dev/widget.js"></script>
 *   <script>
 *     TryOn.init({
 *       apiKey: "your-api-key",
 *       garment: { garmentId: "gmt_123" },
 *       onResult: function(result) { console.log(result.imageUrl); }
 *     });
 *   </script>
 */

import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { TryOnWidget } from "./TryOnWidget";
import type { TryOnConfig } from "./types";
import "./styles.css";

interface TryOnInstance {
  /** Open the try-on modal. */
  open: () => void;
  /** Close the try-on modal. */
  close: () => void;
  /** Remove the widget from the DOM and clean up. */
  destroy: () => void;
}

interface TryOnInitOptions extends TryOnConfig {
  /** CSS selector or DOM element to mount the trigger button into. */
  container?: string | HTMLElement;
  /** Text for the auto-generated trigger button. @default "Try On" */
  triggerText?: string;
}

/**
 * Mount the TryOn widget imperatively.
 *
 * Creates a container, renders the React widget, and returns
 * an instance with `open()`, `close()`, and `destroy()` methods.
 */
function init(options: TryOnInitOptions): TryOnInstance {
  const {
    container,
    triggerText = "Try On",
    onClose,
    onOpen,
    ...config
  } = options;

  // Resolve mount target
  let mountTarget: HTMLElement;
  if (typeof container === "string") {
    const el = document.querySelector<HTMLElement>(container);
    if (!el) throw new Error(`TryOn: container "${container}" not found`);
    mountTarget = el;
  } else if (container instanceof HTMLElement) {
    mountTarget = container;
  } else {
    // Create a floating container
    mountTarget = document.createElement("div");
    mountTarget.id = "tryon-widget-root";
    document.body.appendChild(mountTarget);
  }

  // React root
  let root: Root | null = createRoot(mountTarget);
  let isOpen = false;

  function render(open: boolean) {
    isOpen = open;
    root?.render(
      createElement(TryOnWidget, {
        ...config,
        open: isOpen,
        onOpen: () => {
          isOpen = true;
          onOpen?.();
        },
        onClose: () => {
          isOpen = false;
          render(false);
          onClose?.();
        },
      }, triggerText),
    );
  }

  // Initial render
  render(false);

  return {
    open() {
      render(true);
    },
    close() {
      render(false);
    },
    destroy() {
      root?.unmount();
      root = null;
      // Remove auto-created container
      if (!container && mountTarget.parentNode) {
        mountTarget.parentNode.removeChild(mountTarget);
      }
    },
  };
}

// ─── Global API ──────────────────────────────────────────────────────────────

const TryOn = { init };

// Expose on window for script-tag usage
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>)["TryOn"] = TryOn;
}

export { init, TryOn };
export type { TryOnInstance, TryOnInitOptions };
