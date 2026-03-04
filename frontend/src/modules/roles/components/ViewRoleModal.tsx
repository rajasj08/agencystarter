"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppButton, ToggleSwitch } from "@/components/design";
import { getRoleById, getPermissions } from "../services/roleService";
import { ROUTES } from "@/constants/routes";
import type { Role, Permission } from "../types/roleTypes";

/** Group permissions by first segment of key (e.g. user:create → module "user"). */
function getModule(key: string): string {
  const segment = key.split(/[.:]/)[0] ?? key;
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
}

export interface ViewRoleModalProps {
  roleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewRoleModal({ roleId, open, onOpenChange }: ViewRoleModalProps) {
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !roleId) {
      setRole(null);
      return;
    }
    setLoading(true);
    Promise.all([getRoleById(roleId), getPermissions()])
      .then(([r, perms]) => {
        setRole(r ?? null);
        setPermissions(perms);
      })
      .catch(() => {
        setRole(null);
        setPermissions([]);
      })
      .finally(() => setLoading(false));
  }, [open, roleId]);

  const selectedSet = role ? new Set(role.permissionIds) : new Set<string>();
  const byModule = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const module = getModule(p.key);
    if (!acc[module]) acc[module] = [];
    acc[module].push(p);
    return acc;
  }, {});
  const moduleOrder = Object.keys(byModule).sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Role</DialogTitle>
        </DialogHeader>
        {loading && !role && <p className="text-sm text-text-secondary">Loading…</p>}
        {!loading && role && (
          <div className="space-y-5">
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-text-secondary">Name</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-text-primary">
                {role.name}
                {role.isSystem && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    System
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-text-primary">Permissions</p>
              {moduleOrder.length === 0 ? (
                <span className="text-sm text-text-secondary">None</span>
              ) : (
                <div className="space-y-4">
                  {moduleOrder.map((module) => {
                    const list = byModule[module]!;
                    return (
                      <div key={module}>
                        <p className="mb-2 text-sm font-medium text-text-primary">Module: {module}</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {list.map((perm) => (
                            <div
                              key={perm.id}
                              className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3"
                            >
                              <span className="text-sm text-text-primary">{perm.name}</span>
                              <ToggleSwitch
                                id={`view-${role.id}-${perm.id}`}
                                checked={selectedSet.has(perm.id)}
                                disabled
                                aria-label={perm.name}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {!role.isSystem && (
                <AppButton variant="outline" size="sm" asChild>
                  <Link href={ROUTES.ROLE_EDIT(role.id)} onClick={() => onOpenChange(false)}>
                    Edit
                  </Link>
                </AppButton>
              )}
              <AppButton variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </AppButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
