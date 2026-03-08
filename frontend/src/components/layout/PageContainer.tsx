"use client";

import type { ReactNode } from "react";
import { PageTitle, Breadcrumb, type BreadcrumbItem } from "@/components/design";

interface PageContainerProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  children: ReactNode;
}

export function PageContainer({ title, description, actions, breadcrumbs, children }: PageContainerProps) {
  return (
    <div className="mx-auto max-w-[1200px]">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbs} className="mb-2" />
      )}
      {(title || description || actions) && (
        <div className="flex items-center justify-between gap-6 mb-6">
          <div>
            {title && <PageTitle>{title}</PageTitle>}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
