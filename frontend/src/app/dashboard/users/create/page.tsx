"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { useUserMutations } from "@/modules/users/hooks/useUsers";
import { ProtectedRoute } from "@/core/auth/ProtectedRoute";
import { ROUTES } from "@/constants/routes";
import { PERMISSIONS } from "@/constants/permissions";
import { UserCreateForm, type UserCreateFormValues } from "@/components/users/UserCreateForm";
import type { UserCreateInput } from "@/modules/users/types/userTypes";

export default function UserCreatePage() {
  const router = useRouter();
  const { createUser, loading } = useUserMutations();

  const handleSubmit = useCallback(
    async (data: UserCreateFormValues) => {
      const input: UserCreateInput = {
        email: data.email,
        name: data.name || undefined,
        roleId: data.roleValue,
        invite: data.invite,
        password: data.invite ? undefined : data.password,
      };
      const user = await createUser(input);
      if (user) {
        toast.success(input.invite ? "Invitation sent." : "User created.");
        router.push(ROUTES.USERS);
      }
    },
    [router, createUser]
  );

  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.USER_CREATE}>
      <UserCreateForm
        title="Add User"
        description="Create a new user or send an invitation to join your agency."
        inviteOption={true}
        onSubmit={handleSubmit}
        onCancel={() => router.push(ROUTES.USERS)}
        cancelLabel="Cancel"
        submitLabel="Create User"
        loading={loading}
      />
    </ProtectedRoute>
  );
}
