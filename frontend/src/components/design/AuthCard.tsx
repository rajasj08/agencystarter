"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface AuthCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Card for auth flows (login, register, forgot/reset password, onboarding).
 * Same API as AppCard but with auth-specific styling: constrained width, distinct look.
 */
const AuthCard = React.forwardRef<HTMLDivElement, AuthCardProps>(
  ({ title, description, footer, children, className, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn("rounded-lg shadow-sm", className)} {...props}>
        {(title || description) && (
          <CardHeader className="border-0">
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        {children != null && <CardContent className="border-0 p-6">{children}</CardContent>}
        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>
    );
  }
);
AuthCard.displayName = "AuthCard";

export { AuthCard };
