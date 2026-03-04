"use client";

import type { ReactNode } from "react";
import { PageTitle, Breadcrumb, type BreadcrumbItem } from "@/components/design";

interface PageContainerProps {
  title?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  children: ReactNode;
}

export function PageContainer({ title, actions, breadcrumbs, children }: PageContainerProps) {
  return (
    <div className="mx-auto max-w-[1200px]">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbs} className="mb-2" />
      )}
      {(title || actions) && (
        <div className="flex items-center justify-between gap-6 mb-6">
          {title && <PageTitle>{title}</PageTitle>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
