"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/forms";
import { PermissionMatrix } from "./PermissionMatrix";
import type { Role } from "../types/roleTypes";

export interface RoleFormContentProps {
  mode: "create" | "edit";
  /** When edit and true, name field is read-only. */
  isSystem?: boolean;
  initialData?: Role | null;
}

export function RoleFormContent({ mode, isSystem, initialData }: RoleFormContentProps) {
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="space-y-6">
        <Card className="rounded-2xl border border-border p-6 shadow-sm">
          <CardHeader className="border-0 p-0 pb-4">
            <CardTitle className="text-base font-medium">Role Information</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-w-md">
              {isSystem ? (
                <>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Role name</label>
                  <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-text-secondary">
                    {initialData?.name ?? "—"}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">System role name cannot be changed.</p>
                </>
              ) : (
                <FormInput name="name" label="Role name" required />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border p-6 shadow-sm">
          <CardHeader className="border-0 p-0 pb-4">
            <CardTitle className="text-base font-medium">Permissions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="mb-4 text-sm text-text-secondary">
              Assign permissions to this role. You can only assign permissions that you have.
            </p>
            <PermissionMatrix name="permissionIds" disabled={!!isSystem} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
