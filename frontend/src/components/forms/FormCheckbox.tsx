"use client";

import { useFormContext } from "react-hook-form";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { FormLabel } from "./FormLabel";
import { FormError } from "./FormError";
import { FormHelper } from "./FormHelper";
import { cn } from "@/lib/utils";

export interface FormCheckboxProps<T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  label?: string;
  helperText?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function FormCheckbox<T extends FieldValues>({
  name,
  label,
  helperText,
  id,
  className,
  disabled,
}: FormCheckboxProps<T>) {
  const {
    control,
    formState: { errors },
  } = useFormContext<T>();
  const fieldError = errors[name]?.message as string | undefined;
  const inputId = id ?? name;

  return (
    <div className="flex flex-col gap-1">
      <Controller
        name={name}
        control={control as Control<T>}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox
              id={inputId}
              checked={!!field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              onBlur={field.onBlur}
              ref={field.ref}
              disabled={disabled}
              aria-invalid={!!fieldError}
              className={cn(fieldError && "border-danger", className)}
            />
            {label && (
              <FormLabel labelKey={label} htmlFor={inputId} className="font-normal cursor-pointer" />
            )}
          </div>
        )}
      />
      <FormError message={fieldError} />
      {helperText && <FormHelper text={helperText} />}
    </div>
  );
}
