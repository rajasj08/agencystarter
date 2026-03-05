"use client";

import type { SelectHTMLAttributes } from "react";
import { useFormContext } from "react-hook-form";
import { FormLabel } from "./FormLabel";
import { FormError } from "./FormError";
import { FormHelper } from "./FormHelper";
import { cn } from "@/lib/utils";

export interface FormSelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "name"> {
  name: string;
  label?: string;
  options: FormSelectOption[];
  placeholder?: string;
  helperText?: string;
}

export function FormSelect({
  name,
  label,
  options,
  placeholder,
  helperText,
  id,
  className,
  ...selectProps
}: FormSelectProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const fieldError = errors[name]?.message as string | undefined;
  const inputId = id ?? name;

  return (
    <div className="flex flex-col gap-1">
      {label && <FormLabel labelKey={label} htmlFor={inputId} />}
      <select
        id={inputId}
        {...register(name)}
        {...selectProps}
        aria-invalid={!!fieldError}
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          fieldError && "border-danger focus:ring-danger",
          className
        )}
      >
        {placeholder != null && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <FormError message={fieldError} />
      {helperText && <FormHelper text={helperText} />}
    </div>
  );
}
