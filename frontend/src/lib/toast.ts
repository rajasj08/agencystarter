import { getApiErrorMessage } from "@/lib/apiError";

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
export { toast } from "sonner";

/** Show an API error in the toast. Use in catch blocks when not using a form. */
export function toastApiError(err: unknown, fallback = "Something went wrong"): void {
  toast.error(getApiErrorMessage(err, fallback));
}
