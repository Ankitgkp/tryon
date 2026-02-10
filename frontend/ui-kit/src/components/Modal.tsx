import {
  type ReactNode,
  type MouseEvent,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { cn } from "../utils/cn";

export interface ModalProps {
  /** Whether the modal is currently visible. */
  open: boolean;
  /** Called when the modal should close (overlay click, Escape key, close button). */
  onClose: () => void;
  /** Optional modal title displayed in the header. */
  title?: string;
  /** Modal body content. */
  children: ReactNode;
  /** Optional footer content (e.g. action buttons). */
  footer?: ReactNode;
  /** Additional class names for the modal panel. */
  className?: string;
  /** Whether clicking the overlay closes the modal. @default true */
  closeOnOverlayClick?: boolean;
  /** Whether pressing Escape closes the modal. @default true */
  closeOnEscape?: boolean;
  /** Whether to show the close (×) button. @default true */
  showCloseButton?: boolean;
}

/**
 * An accessible modal dialog component.
 *
 * Traps focus, closes on Escape/overlay click, and renders
 * a centered panel over a dimmed overlay.
 *
 * @example
 * ```tsx
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm">
 *   <p>Are you sure?</p>
 *   <Modal footer={<Button onClick={handleConfirm}>Yes</Button>} />
 * </Modal>
 * ```
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === "Escape") {
        onClose();
      }
    },
    [closeOnEscape, onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, handleKeyDown]);

  // Focus the panel on open for accessibility
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        "tryon-fixed tryon-inset-0 tryon-z-50",
        "tryon-flex tryon-items-center tryon-justify-center",
        "tryon-bg-overlay",
        "tryon-animate-in tryon-fade-in",
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Dialog"}
      onClick={handleOverlayClick}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "tryon-bg-surface tryon-rounded-lg tryon-shadow-xl",
          "tryon-w-full tryon-max-w-lg tryon-mx-4",
          "tryon-max-h-[90vh] tryon-flex tryon-flex-col",
          "tryon-outline-none",
          className,
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="tryon-flex tryon-items-center tryon-justify-between tryon-px-6 tryon-py-4 tryon-border-b tryon-border-border">
            {title && (
              <h2 className="tryon-text-lg tryon-font-semibold tryon-text-text-primary tryon-font-sans">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "tryon-ml-auto tryon-p-1 tryon-rounded",
                  "tryon-text-text-secondary hover:tryon-text-text-primary",
                  "hover:tryon-bg-surface-alt tryon-transition-colors",
                  "focus:tryon-outline-none focus-visible:tryon-ring-2 focus-visible:tryon-ring-primary/50",
                )}
                aria-label="Close dialog"
              >
                <svg
                  className="tryon-h-5 tryon-w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="tryon-px-6 tryon-py-4 tryon-overflow-y-auto tryon-flex-1 tryon-text-text-primary tryon-font-sans">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="tryon-px-6 tryon-py-4 tryon-border-t tryon-border-border tryon-flex tryon-items-center tryon-justify-end tryon-gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

Modal.displayName = "Modal";
