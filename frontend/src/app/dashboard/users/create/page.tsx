"use client";

import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard } from "@/components/design";
import { UserForm } from "@/modules/users";
import { useUserMutations } from "@/modules/users/hooks/useUsers";
import { ROUTES } from "@/constants/routes";
import type { UserCreateInput, UserUpdateInput } from "@/modules/users/types/userTypes";

export default function UserCreatePage() {
  const router = useRouter();
  const { createUser, loading, error } = useUserMutations();

  async function handleSubmit(payload: UserCreateInput | UserUpdateInput) {
    const user = await createUser(payload as UserCreateInput);
    if (user) router.push(ROUTES.USER_VIEW(user.id));
  }

  return (
    <PageContainer title="Create User">
      <AppCard className="rounded-xl p-6">
        {error && (
          <p className="mb-4 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <UserForm mode="create" onSubmit={handleSubmit} loading={loading} />
      </AppCard>
    </PageContainer>
  );
}
