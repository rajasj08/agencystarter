"use client";

import { useEffect } from "react";
import { AppButton } from "@/components/design";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-xl font-semibold text-text-primary">Something went wrong</h1>
      <p className="text-text-secondary text-center max-w-md">
        An unexpected error occurred. You can try again or return to the dashboard.
      </p>
      <div className="flex gap-3">
        <AppButton onClick={() => reset()}>Try again</AppButton>
        <AppButton variant="secondary" onClick={() => (window.location.href = "/dashboard")}>
          Go to dashboard
        </AppButton>
      </div>
    </div>
  );
}
