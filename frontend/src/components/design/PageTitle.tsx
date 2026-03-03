"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type PageTitleLevel = "page" | "section" | "subsection";

const levelClasses: Record<PageTitleLevel, string> = {
  page: "text-2xl font-semibold text-text-primary tracking-tight",
  section: "text-xl font-semibold text-text-primary",
  subsection: "text-lg font-medium text-text-primary",
};

export interface PageTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: PageTitleLevel;
  as?: "h1" | "h2" | "h3";
}

const PageTitle = React.forwardRef<HTMLHeadingElement, PageTitleProps>(
  ({ level = "page", as, className, children, ...props }, ref) => {
    const Comp = as ?? (level === "page" ? "h1" : level === "section" ? "h2" : "h3");
    return (
      <Comp
        ref={ref}
        className={cn(levelClasses[level], className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
PageTitle.displayName = "PageTitle";

export { PageTitle };
