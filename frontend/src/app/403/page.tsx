"use client";

import Link from "next/link";
import { AppButton } from "@/components/design";
import { ROUTES } from "@/constants/routes";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold text-text-primary">403 — Forbidden</h1>
      <p className="text-text-secondary">You don’t have permission to view this page.</p>
      <AppButton asChild>
        <Link href={ROUTES.DASHBOARD}>Back to Dashboard</Link>
      </AppButton>
    </div>
  );
}
