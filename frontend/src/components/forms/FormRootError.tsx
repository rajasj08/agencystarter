"use client";

import { useFormContext } from "react-hook-form";
import { FormError } from "./FormError";

/**
 * Renders root-level form error (e.g. from setError("root", ...) after API errors).
 */
export function FormRootError() {
  const { formState } = useFormContext();
  const message = formState.errors.root?.message as string | undefined;
  return <FormError message={message} />;
}
