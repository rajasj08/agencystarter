"use client";

import { getLabel } from "@/constants/labels";
import { cn } from "@/lib/utils";

export interface FormErrorProps {
  /** Translation key (e.g. auth.emailRequired) or message. */
  message?: string;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;
  const text = /^(auth|errors|agency)\./.test(message) ? getLabel(message) : message;
  return (
    <span role="alert" className={cn("text-sm text-danger", className)}>
      {text}
    </span>
  );
}
