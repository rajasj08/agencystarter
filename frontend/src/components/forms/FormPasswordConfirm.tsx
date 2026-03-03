"use client";

import { useFormContext } from "react-hook-form";
import { FormPassword } from "./FormPassword";

export interface FormPasswordConfirmProps {
  name?: string;
  passwordFieldName?: string;
  label?: string;
  id?: string;
  className?: string;
}

/**
 * Confirm password field. Use with register schema that refines password === confirmPassword.
 * Default name is "confirmPassword"; passwordFieldName is only for display/validation schema.
 */
export function FormPasswordConfirm({
  name = "confirmPassword",
  label = "auth.confirmPassword",
  id,
  className,
}: FormPasswordConfirmProps) {
  return (
    <FormPassword
      name={name}
      label={label}
      id={id}
      className={className}
      autoComplete="new-password"
    />
  );
}
