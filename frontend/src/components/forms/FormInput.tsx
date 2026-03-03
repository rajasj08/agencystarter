"use client";

import type { InputHTMLAttributes } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormLabel } from "./FormLabel";
import { FormError } from "./FormError";
import { FormHelper } from "./FormHelper";
import { cn } from "@/lib/utils";

export interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "name"> {
  name: string;
  /** Translation key (e.g. auth.email) or plain text. */
  label?: string;
  helperText?: string;
  /** Called after RHF onChange (e.g. to derive another field). */
  onAfterChange?: (value: string) => void;
}

export function FormInput({ name, label, helperText, id, className, onAfterChange, onChange, ...inputProps }: FormInputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const fieldError = errors[name]?.message as string | undefined;
  const inputId = id ?? name;
  const reg = register(name);

  return (
    <div className="flex flex-col gap-1">
      {label && <FormLabel labelKey={label} htmlFor={inputId} />}
      <Input
        id={inputId}
        {...reg}
        {...inputProps}
        onChange={(e) => {
          reg.onChange(e);
          onAfterChange?.(e.target.value);
          onChange?.(e);
        }}
        aria-invalid={!!fieldError}
        className={cn(fieldError && "border-danger focus:ring-danger", className)}
      />
      <FormError message={fieldError} />
      {helperText && <FormHelper text={helperText} />}
    </div>
  );
}
