"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AppButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline" | "link";

const variantMap: Record<AppButtonVariant, ButtonProps["variant"]> = {
  primary: "default",
  secondary: "secondary",
  danger: "destructive",
  ghost: "ghost",
  outline: "outline",
  link: "link",
};

export interface AppButtonProps extends Omit<ButtonProps, "variant"> {
  variant?: AppButtonVariant;
  className?: string;
  /** When true, shows loading state and disables the button. */
  loading?: boolean;
}

const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ variant = "primary", className, loading = false, disabled, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variantMap[variant]}
        className={cn(className)}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? "…" : children}
      </Button>
    );
  }
);
AppButton.displayName = "AppButton";

export { AppButton };
