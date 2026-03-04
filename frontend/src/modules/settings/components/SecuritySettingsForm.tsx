"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SecuritySettingsForm() {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium">Security</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <p className="text-sm text-text-secondary">
          Password rules, session timeout, and email verification settings will be available here.
        </p>
        <p className="mt-2 text-sm text-text-secondary">Security options: coming soon.</p>
      </CardContent>
    </Card>
  );
}
