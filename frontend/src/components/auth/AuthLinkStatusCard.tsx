"use client";

import Link from "next/link";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AuthCard, AppButton } from "@/components/design";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export type AuthLinkStatusVariant = "success" | "expired" | "invalid" | "loading";

export interface AuthLinkStatusCardProps {
  variant: AuthLinkStatusVariant;
  title: string;
  message: string;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}

const variantConfig = {
  success: {
    icon: CheckCircle,
    iconClassName: "text-green-600",
  },
  expired: {
    icon: XCircle,
    iconClassName: "text-amber-600",
  },
  invalid: {
    icon: AlertCircle,
    iconClassName: "text-destructive",
  },
  loading: {
    icon: null,
    iconClassName: "",
  },
};

export function AuthLinkStatusCard({
  variant,
  title,
  message,
  primaryAction,
  secondaryAction,
}: AuthLinkStatusCardProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  if (variant === "loading") {
    return (
      <AuthLayout>
        <AuthCard>
          <p className="text-muted-foreground">{message}</p>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard title={title}>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            {Icon && <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconClassName}`} aria-hidden />}
            <p className={variant === "invalid" || variant === "expired" ? "text-muted-foreground" : ""}>
              {message}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <AppButton asChild className="w-full">
              <Link href={primaryAction.href}>{primaryAction.label}</Link>
            </AppButton>
            {secondaryAction && (
              <AppButton variant="outline" asChild className="w-full">
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </AppButton>
            )}
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
