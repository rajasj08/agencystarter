"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormLabel } from "./FormLabel";
import { FormError } from "./FormError";
import { FormHelper } from "./FormHelper";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { AppButton } from "@/components/design";

export interface FormPasswordProps {
  name: string;
  label?: string;
  helperText?: string;
  id?: string;
  className?: string;
  autoComplete?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function FormPassword({
  name,
  label,
  helperText,
  id,
  className,
  autoComplete = "current-password",
  placeholder,
  disabled,
}: FormPasswordProps) {
  const [show, setShow] = useState(false);
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const fieldError = errors[name]?.message as string | undefined;
  const inputId = id ?? name;

  return (
    <div className="flex flex-col gap-1">
      {label && <FormLabel labelKey={label} htmlFor={inputId} />}
      <div className="relative">
        <Input
          id={inputId}
          type={show ? "text" : "password"}
          {...register(name)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!fieldError}
          className={cn("pr-10", fieldError && "border-danger focus:ring-danger", className)}
        />
        <AppButton
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-10 w-10 text-text-secondary hover:text-text-primary"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </AppButton>
      </div>
      <FormError message={fieldError} />
      {helperText && <FormHelper text={helperText} />}
    </div>
  );
}
