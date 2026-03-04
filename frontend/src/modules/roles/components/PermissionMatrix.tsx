"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { ToggleSwitch } from "@/components/design";
import { getPermissions, getMyPermissionIds } from "../services/roleService";
import type { Permission } from "../types/roleTypes";

export interface PermissionMatrixProps {
  name: string;
  className?: string;
  /** When true, all checkboxes are disabled (e.g. system role view). */
  disabled?: boolean;
}

/** Group permissions by first segment of key (e.g. user:create → module "user"). */
function getModule(key: string): string {
  const segment = key.split(/[.:]/)[0] ?? key;
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
}

export function PermissionMatrix({ name, className = "", disabled = false }: PermissionMatrixProps) {
  const { watch, setValue } = useFormContext<{ [k: string]: string[] }>();
  const selected: string[] = watch(name) ?? [];
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [myPermissionIds, setMyPermissionIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPermissions(), getMyPermissionIds()])
      .then(([perms, ids]) => {
        setPermissions(perms);
        setMyPermissionIds(new Set(ids));
      })
      .catch(() => {
        setPermissions([]);
        setMyPermissionIds(new Set());
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    if (disabled) return;
    const allowed = myPermissionIds.has(id);
    if (!allowed) return;
    const next = selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id];
    setValue(name, next, { shouldValidate: true });
  };

  if (loading) {
    return <p className="text-sm text-text-secondary">Loading permissions…</p>;
  }

  const byModule = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const module = getModule(p.key);
    if (!acc[module]) acc[module] = [];
    acc[module].push(p);
    return acc;
  }, {});

  const moduleOrder = Object.keys(byModule).sort();

  return (
    <div className={className}>
      {moduleOrder.map((module) => {
        const list = byModule[module]!;
        return (
          <div key={module} className="mb-6 last:mb-0">
            <p className="mb-2 text-sm font-medium text-text-primary">Module: {module}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {list.map((perm) => {
                const isChecked = selected.includes(perm.id);
                const canAssign = myPermissionIds.has(perm.id);
                const isDisabled = disabled || !canAssign;
                return (
                  <div
                    key={perm.id}
                    className={`flex items-center justify-between rounded-md border border-border bg-muted/30 p-3 ${
                      isDisabled && !canAssign ? "opacity-60" : ""
                    }`}
                  >
                    <span className="text-sm text-text-primary">{perm.name}</span>
                    <ToggleSwitch
                      id={`${name}-${perm.id}`}
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => toggle(perm.id)}
                      aria-label={perm.name}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
