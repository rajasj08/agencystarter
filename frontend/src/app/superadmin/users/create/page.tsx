"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { createUser, type CreateUserInput } from "@/services/superadmin";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import { UserCreateForm, type UserCreateFormValues } from "@/components/users/UserCreateForm";

export default function SuperadminUserCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (data: UserCreateFormValues) => {
      const input: CreateUserInput = {
        agencyId: data.agencyId ?? "",
        email: data.email,
        password: data.password ?? "",
        role: data.roleValue as CreateUserInput["role"],
        name: data.name || undefined,
      };
      setLoading(true);
      try {
        await createUser(input);
        toast.success("User created.");
        router.push(ROUTES.SUPERADMIN_USERS);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  return (
    <PageContainer
      title="Add User"
      breadcrumbs={[
        { label: "Superadmin", href: ROUTES.SUPERADMIN },
        { label: "Platform Users", href: ROUTES.SUPERADMIN_USERS },
        { label: "Add user" },
      ]}
    >
      <UserCreateForm
        title="Add User"
        description="Create a user in an agency. Select an agency first, then choose a role."
        hideHeaderTitle
        showAgencyField
        inviteOption={false}
        onSubmit={handleSubmit}
        onCancel={() => router.push(ROUTES.SUPERADMIN_USERS)}
        cancelLabel="Cancel"
        submitLabel="Create user"
        submitErrorLabel="Create user failed"
        loading={loading}
      />
    </PageContainer>
  );
}
