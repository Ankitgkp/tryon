import {
  type DragEvent,
  type ChangeEvent,
  useState,
  useRef,
  useCallback,
} from "react";
import { cn } from "../utils/cn";

export interface SelectedFile {
  file: File;
  previewUrl: string;
}

export interface ImageUploaderProps {
  onFileSelect: (file: SelectedFile) => void;
  onError?: (message: string) => void;
  acceptedTypes?: string[];
  maxSizeBytes?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export function ImageUploader({
  onFileSelect,
  onError,
  acceptedTypes = DEFAULT_ACCEPTED,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  label = "Drag & drop an image, or click to browse",
  disabled = false,
  className,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndEmit = useCallback(
    (file: File) => {
      if (!acceptedTypes.includes(file.type)) {
        onError?.(
          `Invalid file type "${file.type}". Accepted: ${acceptedTypes.join(", ")}`,
        );
        return;
      }
      if (file.size > maxSizeBytes) {
        const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
        onError?.(`File size exceeds ${maxMB} MB limit.`);
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      onFileSelect({ file, previewUrl });
    },
    [acceptedTypes, maxSizeBytes, onFileSelect, onError],
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) validateAndEmit(file);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndEmit(file);
    e.target.value = "";
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!disabled && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "tryon-relative tryon-flex tryon-flex-col tryon-items-center tryon-justify-center",
        "tryon-gap-3 tryon-p-8",
        "tryon-border-2 tryon-border-dashed tryon-rounded-lg",
        "tryon-transition-colors tryon-duration-150 tryon-cursor-pointer",
        "focus:tryon-outline-none focus-visible:tryon-ring-2 focus-visible:tryon-ring-primary/50",
        isDragging
          ? "tryon-border-primary tryon-bg-primary/5"
          : "tryon-border-border tryon-bg-surface-alt hover:tryon-border-primary/50",
        disabled && "tryon-opacity-50 tryon-cursor-not-allowed",
        className,
      )}
    >
      <svg
        className="tryon-h-10 tryon-w-10 tryon-text-text-secondary"
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
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>

      <p className="tryon-text-sm tryon-text-text-secondary tryon-text-center tryon-font-sans">
        {label}
      </p>

      <p className="tryon-text-xs tryon-text-text-secondary/70 tryon-font-sans">
        {acceptedTypes.map((t) => t.replace("image/", "").toUpperCase()).join(", ")}
        {" · "}
        Max {(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleInputChange}
        className="tryon-hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

ImageUploader.displayName = "ImageUploader";
