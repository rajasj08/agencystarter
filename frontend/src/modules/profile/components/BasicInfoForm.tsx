"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProviderWrapper } from "@/components/forms";
import { FormInput } from "@/components/forms";
import { AppButton } from "@/components/design";
import type { AuthUser } from "@/services/auth";

const schema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  displayName: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  jobTitle: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
});

type FormValues = z.infer<typeof schema>;

export interface BasicInfoFormProps {
  user: AuthUser | null;
  onSubmit: (values: FormValues) => void | Promise<void>;
  loading?: boolean;
}

export function BasicInfoForm({ user, onSubmit, loading = false }: BasicInfoFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      displayName: user?.displayName ?? "",
      phone: user?.phone ?? "",
      avatarUrl: user?.avatarUrl ?? "",
      jobTitle: user?.jobTitle ?? "",
      department: user?.department ?? "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        displayName: user.displayName ?? "",
        phone: user.phone ?? "",
        avatarUrl: user.avatarUrl ?? "",
        jobTitle: user.jobTitle ?? "",
        department: user.department ?? "",
      });
    }
  }, [user?.id]);

  return (
    <FormProviderWrapper form={form as never} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput name="firstName" label="First name" />
        <FormInput name="lastName" label="Last name" />
      </div>
      <FormInput name="displayName" label="Display name (optional override)" />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-text-primary">Email</label>
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-text-secondary">
          {user?.email ?? "—"} <span className="text-xs">(read-only)</span>
        </p>
      </div>
      <FormInput name="phone" label="Phone number" type="tel" />
      <FormInput name="avatarUrl" label="Avatar URL" placeholder="https://..." />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput name="jobTitle" label="Job title" />
        <FormInput name="department" label="Department" />
      </div>
      <AppButton type="submit" loading={loading} disabled={loading}>
        Save basic info
      </AppButton>
    </FormProviderWrapper>
  );
}
