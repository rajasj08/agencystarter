"use client";

import type { TextareaHTMLAttributes } from "react";
import { useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { FormLabel } from "./FormLabel";
import { FormError } from "./FormError";
import { FormHelper } from "./FormHelper";
import { cn } from "@/lib/utils";

export interface FormTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name"> {
  name: string;
  label?: string;
  helperText?: string;
}

export function FormTextarea({ name, label, helperText, id, className, ...textareaProps }: FormTextareaProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const fieldError = errors[name]?.message as string | undefined;
  const inputId = id ?? name;

  return (
    <div className="flex flex-col gap-1">
      {label && <FormLabel labelKey={label} htmlFor={inputId} />}
      <Textarea
        id={inputId}
        {...register(name)}
        {...textareaProps}
        aria-invalid={!!fieldError}
        className={cn(fieldError && "border-danger focus:ring-danger", className)}
      />
      <FormError message={fieldError} />
      {helperText && <FormHelper text={helperText} />}
    </div>
  );
}
