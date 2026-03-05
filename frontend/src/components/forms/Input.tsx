"use client";

import type { InputHTMLAttributes } from "react";
import { Label } from "@/components/ui/label";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <input
        id={inputId}
        className={`w-full px-3 py-2 border border-border rounded-md bg-card text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50 ${className}`}
        {...props}
      />
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
}
