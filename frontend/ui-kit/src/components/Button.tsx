import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "tryon-bg-primary tryon-text-primary-text hover:tryon-bg-primary-hover focus-visible:tryon-ring-2 focus-visible:tryon-ring-primary/50",
  secondary:
    "tryon-bg-surface tryon-text-text-primary tryon-border tryon-border-border hover:tryon-bg-surface-alt focus-visible:tryon-ring-2 focus-visible:tryon-ring-border",
  ghost:
    "tryon-bg-transparent tryon-text-text-secondary hover:tryon-bg-surface-alt focus-visible:tryon-ring-2 focus-visible:tryon-ring-border",
  danger:
    "tryon-bg-error tryon-text-white hover:tryon-bg-error/90 focus-visible:tryon-ring-2 focus-visible:tryon-ring-error/50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "tryon-px-3 tryon-py-1.5 tryon-text-sm",
  md: "tryon-px-4 tryon-py-2 tryon-text-sm",
  lg: "tryon-px-6 tryon-py-3 tryon-text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "tryon-inline-flex tryon-items-center tryon-justify-center tryon-gap-2",
          "tryon-rounded tryon-font-sans tryon-font-medium",
          "tryon-transition-colors tryon-duration-150 tryon-ease-in-out",
          "focus:tryon-outline-none",
          "disabled:tryon-opacity-50 disabled:tryon-cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "tryon-w-full",
          className,
        )}
        {...props}
      >
        {loading && (
          <svg
            className="tryon-animate-spin tryon-h-4 tryon-w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="tryon-opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="tryon-opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
