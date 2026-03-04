"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SecuritySettingsForm() {
  return (
    <Card className="rounded-2xl border border-border p-6 shadow-sm">
      <CardHeader className="border-0 p-0 pb-4">
        <CardTitle className="text-base font-medium">Security</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-sm text-text-secondary">
          Password rules, session timeout, and email verification settings will be available here.
        </p>
        <p className="mt-2 text-sm text-text-secondary">Security options: coming soon.</p>
      </CardContent>
    </Card>
  );
}
