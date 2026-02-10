/**
 * @tryon/ui-kit — Themeable React UI component library
 *
 * Import components:
 *   import { Button, Modal, ImageUploader, Loader, ErrorState } from "@tryon/ui-kit";
 *
 * Import styles (required once in your app):
 *   import "@tryon/ui-kit/styles.css";
 */

// Styles — must be imported by the consuming app
import "./styles.css";

// Components
export {
  Button,
  Modal,
  ImageUploader,
  Loader,
  ErrorState,
} from "./components";

// Types
export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  ModalProps,
  ImageUploaderProps,
  SelectedFile,
  LoaderProps,
  LoaderSize,
  ErrorStateProps,
} from "./components";

// Utilities
export { cn } from "./utils";
