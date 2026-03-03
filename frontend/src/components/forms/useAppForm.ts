import { useForm, type UseFormProps, type DefaultValues, type FieldValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

export interface UseAppFormOptions<T extends z.ZodType> {
  schema: T;
  defaultValues?: DefaultValues<z.infer<T>>;
  /** Optional; matches RHF UseFormProps for mode etc. */
  options?: Omit<UseFormProps<z.infer<T> & FieldValues>, "resolver" | "defaultValues">;
}

/**
 * Unified form hook: React Hook Form + Zod resolver.
 * Pages use form components; form state is created in a wrapper or module that uses this.
 */
export function useAppForm<T extends z.ZodType>(opts: UseAppFormOptions<T>) {
  const { schema, defaultValues, options = {} } = opts;
  type Values = z.infer<T> & FieldValues;
  return useForm<Values>({
    resolver: zodResolver(schema as Parameters<typeof zodResolver>[0]) as unknown as Resolver<Values>,
    defaultValues: defaultValues as DefaultValues<Values>,
    mode: "onBlur",
    ...options,
  });
}
