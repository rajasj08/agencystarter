import type { UseFormSetError, FieldValues } from "react-hook-form";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/lib/toast";

export type { ApiErrorLike } from "@/lib/apiError";
export { getApiErrorMessage } from "@/lib/apiError";

/**
 * Set form root error from API response and show the same message in a toast.
 * Use in catch blocks so errors appear both inline and in the common toast view.
 */
export function setFormApiError<T extends FieldValues>(
  setError: UseFormSetError<T>,
  err: unknown,
  fallback = "Something went wrong"
) {
  const display = getApiErrorMessage(err, fallback);
  (setError as (name: "root", opts: { message: string }) => void)("root", { message: display });
  toast.error(display);
}
