"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard } from "@/components/design";
import { UserForm } from "@/modules/users";
import { useUser, useUserMutations } from "@/modules/users/hooks/useUsers";
import { ROUTES } from "@/constants/routes";
import type { UserUpdateInput } from "@/modules/users/types/userTypes";

export default function UserEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading, error, fetchUser } = useUser(id);
  const { updateUser, loading: saving, error: saveError } = useUserMutations();

  useEffect(() => {
    if (id) fetchUser(id);
  }, [id, fetchUser]);

  async function handleSubmit(payload: UserUpdateInput) {
    const updated = await updateUser(id, payload);
    if (updated) router.push(ROUTES.USER_VIEW(id));
  }

  if (loading && !user) {
    return (
      <PageContainer title="Edit User">
        <AppCard className="rounded-xl p-6">
          <p className="text-text-secondary">Loading…</p>
        </AppCard>
      </PageContainer>
    );
  }

  if (error && !user) {
    return (
      <PageContainer title="Edit User">
        <AppCard className="rounded-xl p-6">
          <p className="text-danger" role="alert">
            {error}
          </p>
        </AppCard>
      </PageContainer>
    );
  }

  if (!user) return null;

  return (
    <PageContainer title={`Edit ${user.name || user.email}`}>
      <AppCard className="max-w-lg rounded-xl p-6">
        {(error || saveError) && (
          <p className="mb-4 text-sm text-danger" role="alert">
            {error || saveError}
          </p>
        )}
        <UserForm
          mode="edit"
          initialData={user}
          onSubmit={handleSubmit}
          loading={saving}
        />
      </AppCard>
    </PageContainer>
  );
}
