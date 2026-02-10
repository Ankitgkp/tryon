import { cn } from "../utils/cn";

/** Size preset for the Loader. */
export type LoaderSize = "sm" | "md" | "lg";

export interface LoaderProps {
  /** Size of the spinner. @default "md" */
  size?: LoaderSize;
  /** Accessible label. @default "Loading" */
  label?: string;
  /** Additional class names. */
  className?: string;
}

const sizeStyles: Record<LoaderSize, string> = {
  sm: "tryon-h-4 tryon-w-4 tryon-border-2",
  md: "tryon-h-8 tryon-w-8 tryon-border-[3px]",
  lg: "tryon-h-12 tryon-w-12 tryon-border-4",
};

/**
 * A simple animated spinner loader.
 *
 * Uses CSS border animation, themed via CSS custom properties.
 * No text — pair with a message if needed.
 *
 * @example
 * ```tsx
 * <Loader size="lg" label="Generating image…" />
 * ```
 */
export function Loader({
  size = "md",
  label = "Loading",
  className,
}: LoaderProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("tryon-flex tryon-items-center tryon-justify-center", className)}
    >
      <div
        className={cn(
          "tryon-animate-spin tryon-rounded-full",
          "tryon-border-primary/30 tryon-border-t-primary",
          sizeStyles[size],
        )}
      />
      <span className="tryon-sr-only">{label}</span>
    </div>
  );
}

Loader.displayName = "Loader";
