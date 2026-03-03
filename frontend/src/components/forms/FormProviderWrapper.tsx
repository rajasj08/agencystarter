"use client";

import type { ReactNode } from "react";
import { FormProvider, type UseFormReturn, type FieldValues } from "react-hook-form";

interface FormProviderWrapperProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  children: ReactNode;
  /** Optional class for the form element (e.g. space-y-4). */
  className?: string;
  /** If provided, renders a <form> with onSubmit; otherwise just a div. */
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  id?: string;
}

/**
 * Wraps children with React Hook Form's FormProvider and optional form layout.
 * Use with form components (FormInput, FormPassword, etc.) so pages don't use useForm directly.
 */
export function FormProviderWrapper<T extends FieldValues>({
  form,
  children,
  className = "space-y-4",
  onSubmit,
  id,
}: FormProviderWrapperProps<T>) {
  const content = <FormProvider {...form}>{children}</FormProvider>;
  if (onSubmit != null) {
    return (
      <form id={id} onSubmit={onSubmit} className={className} noValidate>
        {content}
      </form>
    );
  }
  return <div className={className}>{content}</div>;
}
