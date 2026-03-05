import { getApiErrorMessage } from "@/lib/apiError";
import { toast as sonnerToast } from "sonner";

/**
 * Central toast API. All success/error/info feedback should go through here
 * so messages appear in the common Toaster (root layout).
 *
 * Usage:
 *   toast.success("Saved.");
 *   toast.error("Something went wrong");
 *   toast.info("Processing…");
 *   toastApiError(err, "Operation failed");
 */
export const toast = sonnerToast;

/** Show an API error in the toast. Use in catch blocks when not using a form. */
export function toastApiError(err: unknown, fallback = "Something went wrong"): void {
  sonnerToast.error(getApiErrorMessage(err, fallback));
}
