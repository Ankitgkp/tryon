/**
 * TryOnWidget — The main React component.
 *
 * Orchestrates the full try-on flow:
 *   1. Upload  — user picks/drops a photo
 *   2. Process — upload to API, create job, poll for result
 *   3. Result  — display generated image
 *   4. Error   — display error with retry
 *
 * Uses @tryon/ui-kit components exclusively for rendering.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Modal,
  Button,
  ImageUploader,
  Loader,
  ErrorState,
} from "@tryon/ui-kit";
import type { SelectedFile } from "@tryon/ui-kit";

import type {
  TryOnConfig,
  TryOnResult,
  TryOnError,
  WidgetStep,
} from "./types";
import { TryOnApiClient, TryOnApiError } from "./api-client";
import { applyTheme } from "./theme";
import "./styles.css";

export interface TryOnWidgetProps extends TryOnConfig {
  /** Control modal open state externally. @default false */
  open?: boolean;
  /** Trigger element — if provided, clicking it opens the modal. */
  children?: React.ReactNode;
}

/**
 * Embeddable Try-On Widget.
 *
 * @example
 * ```tsx
 * import { TryOnWidget } from "@tryon/widget-sdk";
 * import "@tryon/widget-sdk/styles.css";
 *
 * <TryOnWidget
 *   apiKey="your-api-key"
 *   garment={{ garmentId: "gmt_123" }}
 *   onResult={(result) => console.log(result.imageUrl)}
 * >
 *   <button>Try On</button>
 * </TryOnWidget>
 * ```
 */
export function TryOnWidget({
  apiKey,
  apiBaseUrl,
  garment,
  theme,
  onResult,
  onError,
  onClose,
  onOpen,
  open: controlledOpen,
  children,
}: TryOnWidgetProps) {
  // ── State ────────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(controlledOpen ?? false);
  const [step, setStep] = useState<WidgetStep>("upload");
  const [userPreview, setUserPreview] = useState<string | null>(null);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [error, setError] = useState<TryOnError | null>(null);
  const [statusText, setStatusText] = useState("Preparing…");

  const containerRef = useRef<HTMLDivElement>(null);
  const selectedFileRef = useRef<File | null>(null);
  const clientRef = useRef<TryOnApiClient>(
    new TryOnApiClient(apiKey, apiBaseUrl),
  );

  // Sync controlled open state
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setIsOpen(controlledOpen);
    }
  }, [controlledOpen]);

  // Apply theme when container mounts
  useEffect(() => {
    if (containerRef.current) {
      applyTheme(containerRef.current, theme);
    }
  }, [theme]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setStep("upload");
    setResult(null);
    setError(null);
    setUserPreview(null);
    selectedFileRef.current = null;
    onOpen?.();
  }, [onOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Revoke preview URL
    if (userPreview) {
      URL.revokeObjectURL(userPreview);
    }
    onClose?.();
  }, [onClose, userPreview]);

  const handleFileSelect = useCallback((selected: SelectedFile) => {
    selectedFileRef.current = selected.file;
    setUserPreview(selected.previewUrl);
  }, []);

  const handleFileError = useCallback(
    (message: string) => {
      const err: TryOnError = { code: "FILE_VALIDATION", message };
      setError(err);
      onError?.(err);
    },
    [onError],
  );

  const handleGenerate = useCallback(async () => {
    const file = selectedFileRef.current;
    if (!file) return;

    setStep("processing");
    setStatusText("Uploading your photo…");
    setError(null);

    try {
      // Step 1: Upload image
      const imageRef = await clientRef.current.uploadImage(file);
      setStatusText("Creating try-on…");

      // Step 2: Create try-on job
      const jobId = await clientRef.current.createTryOn(imageRef, garment);
      setStatusText("Generating your look…");

      // Step 3: Poll for result
      const tryOnResult = await clientRef.current.pollJob(
        jobId,
        (status) => {
          if (status === "processing") setStatusText("AI is working…");
        },
      );

      setResult(tryOnResult);
      setStep("result");
      onResult?.(tryOnResult);
    } catch (err) {
      const tryOnError: TryOnError =
        err instanceof TryOnApiError
          ? { code: err.code, message: err.message }
          : {
              code: "UNKNOWN_ERROR",
              message: "Something went wrong. Please try again.",
            };

      setError(tryOnError);
      setStep("error");
      onError?.(tryOnError);
    }
  }, [garment, onResult, onError]);

  const handleRetry = useCallback(() => {
    setStep("upload");
    setResult(null);
    setError(null);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef}>
      {/* Trigger element */}
      {children && (
        <div onClick={handleOpen} style={{ cursor: "pointer", display: "inline-block" }}>
          {children}
        </div>
      )}

      <Modal
        open={isOpen}
        onClose={handleClose}
        title="Virtual Try-On"
        className="tryon-max-w-2xl"
        footer={renderFooter(step, handleGenerate, handleRetry, handleClose, !!userPreview)}
      >
        <div className="tryon-min-h-[300px] tryon-flex tryon-flex-col tryon-items-center tryon-justify-center">
          {step === "upload" && (
            <UploadStep
              preview={userPreview}
              onFileSelect={handleFileSelect}
              onError={handleFileError}
              error={error}
            />
          )}

          {step === "processing" && <ProcessingStep statusText={statusText} />}

          {step === "result" && result && (
            <ResultStep result={result} userPreview={userPreview} />
          )}

          {step === "error" && error && (
            <ErrorStep error={error} />
          )}
        </div>
      </Modal>
    </div>
  );
}

TryOnWidget.displayName = "TryOnWidget";

// ─── Sub-components ────────────────────────────────────────────────────────────

function UploadStep({
  preview,
  onFileSelect,
  onError,
  error,
}: {
  preview: string | null;
  onFileSelect: (file: SelectedFile) => void;
  onError: (message: string) => void;
  error: TryOnError | null;
}) {
  return (
    <div className="tryon-w-full tryon-space-y-4">
      {preview ? (
        <div className="tryon-flex tryon-flex-col tryon-items-center tryon-gap-3">
          <img
            src={preview}
            alt="Your uploaded photo"
            className="tryon-max-h-64 tryon-rounded-lg tryon-object-contain tryon-border tryon-border-border"
          />
          <p className="tryon-text-sm tryon-text-text-secondary tryon-font-sans">
            Photo selected. Click &ldquo;Generate&rdquo; to start.
          </p>
        </div>
      ) : (
        <ImageUploader
          onFileSelect={onFileSelect}
          onError={onError}
          label="Upload a photo of yourself"
          maxSizeBytes={10 * 1024 * 1024}
        />
      )}

      {error && (
        <p className="tryon-text-sm tryon-text-error tryon-text-center tryon-font-sans">
          {error.message}
        </p>
      )}
    </div>
  );
}

function ProcessingStep({ statusText }: { statusText: string }) {
  return (
    <div className="tryon-flex tryon-flex-col tryon-items-center tryon-gap-4 tryon-py-8">
      <Loader size="lg" label={statusText} />
      <p className="tryon-text-sm tryon-text-text-secondary tryon-font-sans tryon-animate-pulse">
        {statusText}
      </p>
    </div>
  );
}

function ResultStep({
  result,
  userPreview,
}: {
  result: TryOnResult;
  userPreview: string | null;
}) {
  return (
    <div className="tryon-w-full tryon-space-y-4">
      <div className="tryon-result-grid">
        {userPreview && (
          <div className="tryon-flex tryon-flex-col tryon-items-center tryon-gap-2">
            <p className="tryon-text-xs tryon-text-text-secondary tryon-font-sans tryon-uppercase tryon-tracking-wider">
              Original
            </p>
            <img
              src={userPreview}
              alt="Original photo"
              className="tryon-w-full tryon-rounded-lg tryon-object-contain tryon-border tryon-border-border"
            />
          </div>
        )}
        <div className="tryon-flex tryon-flex-col tryon-items-center tryon-gap-2">
          <p className="tryon-text-xs tryon-text-text-secondary tryon-font-sans tryon-uppercase tryon-tracking-wider">
            Try-On Result
          </p>
          <img
            src={result.imageUrl}
            alt="Virtual try-on result"
            className="tryon-w-full tryon-rounded-lg tryon-object-contain tryon-border tryon-border-border"
          />
        </div>
      </div>
      <p className="tryon-text-xs tryon-text-text-secondary tryon-text-center tryon-font-sans">
        Generated in {(result.processingTimeMs / 1000).toFixed(1)}s
      </p>
    </div>
  );
}

function ErrorStep({ error }: { error: TryOnError }) {
  return (
    <ErrorState
      message={error.message}
      description={`Error code: ${error.code}`}
    />
  );
}

function renderFooter(
  step: WidgetStep,
  onGenerate: () => void,
  onRetry: () => void,
  onClose: () => void,
  hasImage: boolean,
) {
  switch (step) {
    case "upload":
      return (
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onGenerate}
            disabled={!hasImage}
          >
            Generate
          </Button>
        </>
      );
    case "processing":
      return (
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      );
    case "result":
      return (
        <>
          <Button variant="ghost" onClick={onRetry}>
            Try Another
          </Button>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </>
      );
    case "error":
      return (
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={onRetry}>
            Try Again
          </Button>
        </>
      );
  }
}
