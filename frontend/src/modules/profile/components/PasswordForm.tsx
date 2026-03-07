"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProviderWrapper } from "@/components/forms";
import { FormPassword } from "@/components/forms";
import { AppButton } from "@/components/design";
import { changePassword, type ChangePasswordResponse } from "@/services/auth";
import { AppCard } from "@/components/design";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  });

type FormValues = z.infer<typeof schema>;

export interface PasswordFormProps {
  /** Called after successful password change. Receives API response (includes updated user when forced change). */
  onSuccess?: (response: ChangePasswordResponse) => void;
  onError?: (message: string) => void;
}

export function PasswordForm({ onSuccess, onError }: PasswordFormProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  async function handleSubmit(values: FormValues) {
    setLoading(true);
    form.clearErrors();
    try {
      const response = await changePassword(values.currentPassword, values.newPassword, values.confirmNewPassword);
      form.reset();
      onSuccess?.(response);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to change password";
      form.setError("root", { message });
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppCard className="rounded-xl p-6 max-w-lg">
      <h3 className="text-lg font-medium text-text-primary mb-4">Change password</h3>
      <p className="text-sm text-text-secondary mb-6">
        Enter your current password and choose a new password. Use at least 8 characters.
      </p>
      <FormProviderWrapper form={form as never} onSubmit={handleSubmit} className="space-y-6">
        <FormPassword
          name="currentPassword"
          label="Current password"
          autoComplete="current-password"
        />
        <FormPassword
          name="newPassword"
          label="New password"
          autoComplete="new-password"
          helperText="At least 8 characters"
        />
        <FormPassword
          name="confirmNewPassword"
          label="Confirm new password"
          autoComplete="new-password"
        />
        {form.formState.errors.root?.message && (
          <p className="text-sm text-danger" role="alert">
            {form.formState.errors.root.message}
          </p>
        )}
        <AppButton type="submit" loading={loading} disabled={loading}>
          Change password
        </AppButton>
      </FormProviderWrapper>
    </AppCard>
  );
}
