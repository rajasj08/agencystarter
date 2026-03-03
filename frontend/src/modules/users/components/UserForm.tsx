"use client";

import { useEffect } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProviderWrapper } from "@/components/forms";
import { FormInput, FormSelect, FormCheckbox, FormPassword } from "@/components/forms";
import { AppButton } from "@/components/design";
import { ROLES } from "@/constants/permissions";
import type { User, UserCreateInput, UserUpdateInput } from "../types/userTypes";

const createSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Invalid email"),
    name: z.string().optional(),
    role: z.string().min(1, "Role is required"),
    invite: z.boolean().optional(),
    password: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.invite) return true;
      return !!(data.password && data.password.length >= 8);
    },
    { message: "Password must be at least 8 characters when not inviting", path: ["password"] }
  );

const updateSchema = z.object({
  name: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  status: z.enum(["ACTIVE", "DISABLED", "SUSPENDED"]).optional(),
});

export type UserCreateFormValues = z.infer<typeof createSchema>;
export type UserUpdateFormValues = z.infer<typeof updateSchema>;

const roleOptions = Object.values(ROLES).map((r) => ({ value: r, label: r.replace(/_/g, " ") }));
const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "DISABLED", label: "Disabled" },
  { value: "SUSPENDED", label: "Suspended" },
];

export interface UserFormProps {
  mode: "create" | "edit";
  initialData?: User | null;
  onSubmit: (payload: UserCreateInput | UserUpdateInput) => void | Promise<void>;
  loading?: boolean;
}

export function UserForm({ mode, initialData, onSubmit, loading = false }: UserFormProps) {
  const isCreate = mode === "create";

  const createForm = useForm<UserCreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      email: "",
      name: "",
      role: ROLES.AGENCY_MEMBER,
      invite: false,
      password: "",
    },
  });

  const updateForm = useForm<UserUpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      role: initialData?.role ?? ROLES.AGENCY_MEMBER,
      status: initialData?.status === "INVITED" ? "ACTIVE" : (initialData?.status ?? "ACTIVE"),
    },
  });

  useEffect(() => {
    if (!isCreate && initialData) {
      updateForm.reset({
        name: initialData.name ?? "",
        role: initialData.role,
        status: initialData.status === "INVITED" ? "ACTIVE" : initialData.status,
      });
    }
  }, [isCreate, initialData?.id]);

  const invite = isCreate && createForm.watch("invite");

  const handleSubmit = isCreate
    ? createForm.handleSubmit((values) => {
        const v = values as UserCreateFormValues;
        onSubmit({
          email: v.email,
          name: v.name || undefined,
          role: v.role,
          invite: v.invite,
          password: v.invite ? undefined : v.password,
        });
      })
    : updateForm.handleSubmit((values) => {
        const v = values as UserUpdateFormValues;
        onSubmit({
          name: v.name || undefined,
          role: v.role,
          status: v.status,
        });
      });

  const form = isCreate ? createForm : updateForm;

  return (
    <FormProviderWrapper form={form as unknown as ReturnType<typeof useForm<FieldValues>>} onSubmit={handleSubmit} className="space-y-6">
      {isCreate && (
        <>
          <FormInput name="email" label="Email" type="email" required />
          <FormInput name="name" label="Name" />
          <FormSelect name="role" label="Role" options={roleOptions} />
          <FormCheckbox name="invite" label="Send invitation email (user sets password)" />
          {!invite && (
            <FormPassword name="password" label="Password" helperText="Min 8 characters" />
          )}
        </>
      )}
      {!isCreate && (
        <>
          <FormInput name="name" label="Name" />
          <FormSelect name="role" label="Role" options={roleOptions} />
          <FormSelect name="status" label="Status" options={statusOptions} />
        </>
      )}
      <div className="flex gap-2">
        <AppButton type="submit" loading={loading} disabled={loading}>
          {isCreate ? "Create User" : "Save Changes"}
        </AppButton>
      </div>
    </FormProviderWrapper>
  );
}
