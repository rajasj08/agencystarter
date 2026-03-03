"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { getPermissions } from "../services/roleService";
import type { Permission } from "../types/roleTypes";

export interface PermissionSelectorProps {
  name: string;
  className?: string;
}

export function PermissionSelector({ name, className }: PermissionSelectorProps) {
  const { watch, setValue } = useFormContext();
  const selected: string[] = watch(name) ?? [];
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPermissions()
      .then(setPermissions)
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id];
    setValue(name, next, { shouldValidate: true });
  };

  if (loading) {
    return <p className="text-sm text-text-secondary">Loading permissions…</p>;
  }

  const byResource = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const resource = p.key.split(":")[0];
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(p);
    return acc;
  }, {});

  const resourceOrder = ["user", "agency", "settings", "admin"];

  return (
    <div className={cn("space-y-4", className)}>
      {resourceOrder.map((resource) => {
        const list = byResource[resource];
        if (!list?.length) return null;
        const label = resource.charAt(0).toUpperCase() + resource.slice(1);
        return (
          <div key={resource}>
            <p className="mb-2 text-sm font-medium text-text-primary">{label}</p>
            <div className="flex flex-col gap-2 pl-2">
              {list.map((perm) => (
                <label
                  key={perm.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary"
                >
                  <Checkbox
                    checked={selected.includes(perm.id)}
                    onChange={() => toggle(perm.id)}
                    aria-label={perm.name}
                  />
                  {perm.name}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
