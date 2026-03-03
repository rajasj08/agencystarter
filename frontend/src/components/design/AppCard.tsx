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

export interface AppCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const AppCard = React.forwardRef<HTMLDivElement, AppCardProps>(
  ({ title, description, footer, children, className, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn("rounded-lg shadow-sm", className)} {...props}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        {children != null && <CardContent>{children}</CardContent>}
        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>
    );
  }
);
AppCard.displayName = "AppCard";

export { AppCard };
export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
