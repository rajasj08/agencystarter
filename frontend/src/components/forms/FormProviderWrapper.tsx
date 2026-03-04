"use client";

import type { ReactNode } from "react";
import { FormProvider, type UseFormReturn, type FieldValues } from "react-hook-form";

interface FormProviderWrapperProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  children: ReactNode;
  /** Optional class for the form element (e.g. space-y-4). */
  className?: string;
  /** Success callback: called with validated data only after validation passes. Wired via form.handleSubmit so validation runs and default submit is prevented. */
  onSubmit?: (data: T) => void | Promise<void>;
  id?: string;
}

/**
 * Wraps children with React Hook Form's FormProvider and optional form layout.
 * Use with form components (FormInput, FormPassword, etc.) so pages don't use useForm directly.
 * When onSubmit is provided, renders a <form> that runs validation and calls onSubmit only with valid data.
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
      <form
        id={id}
        className={className}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit(onSubmit)(e);
        }}
      >
        {content}
      </form>
    );
  }
  return <div className={className}>{content}</div>;
}
