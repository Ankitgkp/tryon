import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface ErrorStateProps {
  message: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}
export function ErrorState({
  message,
  description,
  action,
  icon,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "tryon-flex tryon-flex-col tryon-items-center tryon-justify-center tryon-gap-3",
        "tryon-rounded-lg tryon-bg-error-bg tryon-p-6 tryon-text-center",
        className,
      )}
    >
      {icon ?? (
        <svg
          className="tryon-h-10 tryon-w-10 tryon-text-error"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      )}

      <p className="tryon-text-sm tryon-font-semibold tryon-text-error-text tryon-font-sans">
        {message}
      </p>

      {description && (
        <p className="tryon-text-sm tryon-text-error-text/80 tryon-max-w-sm tryon-font-sans">
          {description}
        </p>
      )}

      {action && <div className="tryon-mt-1">{action}</div>}
    </div>
  );
}

ErrorState.displayName = "ErrorState";
