"use client";

import { useEffect, useMemo } from "react";
import { FormSelect } from "@/components/forms";
import { useRoles } from "../hooks/useRoles";
import type { Role } from "../types/roleTypes";

export interface RoleSelectOption {
  value: string;
  label: string;
}

export interface RoleSelectProps {
  name: string;
  label?: string;
  helperText?: string;
  /** When provided, use these options (e.g. when parent already has roles). Otherwise fetch via API. */
  options?: RoleSelectOption[];
  /** Optional placeholder when no selection yet. */
  placeholder?: string;
}

/**
 * Shared role dropdown for forms. Shows all agency roles (system + custom).
 * Use wherever a role selection is needed: user create/edit, settings default role, etc.
 * Must be used inside a FormProvider (react-hook-form).
 */
export function RoleSelect({ name, label = "Role", helperText, options: optionsProp, placeholder }: RoleSelectProps) {
  const { data: roles, loading, fetchRoles } = useRoles();

  const isControlled = optionsProp !== undefined;
  useEffect(() => {
    if (!isControlled) fetchRoles();
  }, [isControlled, fetchRoles]);

  const options = useMemo(() => {
    if (optionsProp !== undefined) return optionsProp;
    return roles.map((r: Role) => ({ value: r.id, label: r.name }));
  }, [optionsProp, roles]);

  if (!isControlled && loading && options.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
        <div className="flex h-10 w-full items-center rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-text-secondary">
          Loading roles…
        </div>
      </div>
    );
  }

  return (
    <FormSelect
      name={name}
      label={label}
      options={options.length > 0 ? options : [{ value: "", label: "No roles" }]}
      helperText={helperText}
      placeholder={placeholder}
    />
  );
}
