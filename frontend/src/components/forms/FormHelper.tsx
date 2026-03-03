"use client";

import { getLabel } from "@/constants/labels";
import { cn } from "@/lib/utils";

export interface FormHelperProps {
  /** Translation key or plain text. */
  text?: string;
  className?: string;
}

export function FormHelper({ text, className }: FormHelperProps) {
  if (!text) return null;
  const display = /^(auth|errors|agency)\./.test(text) ? getLabel(text) : text;
  return (
    <p className={cn("text-sm text-text-secondary mt-1", className)}>
      {display}
    </p>
  );
}
