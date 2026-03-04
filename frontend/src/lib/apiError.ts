import { getErrorMessage } from "@/constants/errorMap";

export interface ApiErrorLike {
  response?: { data?: { message?: string; code?: string } };
}

/**
 * Get a user-facing message from an API error (e.g. axios error with response.data).
 * Use for toast or form error display.
 */
export function getApiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  const apiErr = err as ApiErrorLike;
  const message = apiErr?.response?.data?.message;
  const code = apiErr?.response?.data?.code;
  return code ? getErrorMessage(code, message ?? fallback) : message ?? fallback;
}
