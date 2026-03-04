"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProviderWrapper } from "@/components/forms";
import { FormInput } from "@/components/forms";
import { AppButton } from "@/components/design";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});

type FormValues = z.infer<typeof schema>;

export interface ProfileFormProps {
  initialName: string | null;
  onSubmit: (values: FormValues) => void | Promise<void>;
  loading?: boolean;
}

export function ProfileForm({ initialName, onSubmit, loading = false }: ProfileFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialName ?? "" },
  });

  return (
    <FormProviderWrapper form={form as never} onSubmit={onSubmit} className="space-y-6">
      <FormInput name="name" label="Display name" />
      <AppButton type="submit" loading={loading} disabled={loading}>
        Save
      </AppButton>
    </FormProviderWrapper>
  );
}
