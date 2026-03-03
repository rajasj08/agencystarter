"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { getLabel } from "@/constants/labels";
import { cn } from "@/lib/utils";

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Translation key (e.g. auth.email) or plain text. */
  labelKey?: string;
}

export function FormLabel({ labelKey, children, className, ...props }: FormLabelProps) {
  const text = labelKey != null ? getLabel(labelKey) : children;
  return (
    <Label className={cn("text-text-primary", className)} {...props}>
      {text}
    </Label>
  );
}
