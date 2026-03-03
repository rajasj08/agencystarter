import type { UseFormSetError, FieldValues } from "react-hook-form";
import { getErrorMessage } from "@/constants/errorMap";

export interface ApiErrorLike {
  response?: { data?: { message?: string; code?: string } };
}

/**
 * Set form root or field error from API response. Use in catch blocks.
 * Maps known codes via errorMap; otherwise uses response.data.message or fallback.
 */
export function setFormApiError<T extends FieldValues>(
  setError: UseFormSetError<T>,
  err: unknown,
  fallback = "Something went wrong"
) {
  const apiErr = err as ApiErrorLike;
  const message = apiErr?.response?.data?.message;
  const code = apiErr?.response?.data?.code;
  const display = code ? getErrorMessage(code, message ?? fallback) : message ?? fallback;
  (setError as (name: "root", opts: { message: string }) => void)("root", { message: display });
}
