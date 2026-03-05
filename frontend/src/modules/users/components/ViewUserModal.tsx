"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AppButton } from "@/components/design";
import { UserStatusBadge } from "./UserStatusBadge";
import { ROUTES } from "@/constants/routes";
import type { User } from "../types/userTypes";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface ViewUserModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit?: boolean;
}

export function ViewUserModal({ user, open, onOpenChange, canEdit }: ViewUserModalProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 pr-12 py-4">
          <DialogTitle>User details</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-text-secondary">Name</p>
            <p className="mt-1 text-sm text-text-primary">{user.name || "—"}</p>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-text-secondary">Email</p>
            <p className="mt-1 text-sm text-text-primary">{user.email}</p>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-text-secondary">Role</p>
            <p className="mt-1 text-sm text-text-primary">{user.role}</p>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-text-secondary">Status</p>
            <p className="mt-1">
              <UserStatusBadge status={user.status} />
            </p>
          </div>
          {user.agency && (
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-text-secondary">Agency</p>
              <p className="mt-1 text-sm text-text-primary">{user.agency.name}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-text-secondary">Created</p>
              <p className="mt-1 text-text-primary">{formatDate(user.createdAt)}</p>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-text-secondary">Last updated</p>
              <p className="mt-1 text-text-primary">{formatDate(user.updatedAt)}</p>
            </div>
            {user.lastLoginAt && (
              <div className="col-span-2 rounded-md border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-text-secondary">Last login</p>
                <p className="mt-1 text-text-primary">{formatDate(user.lastLoginAt)}</p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="shrink-0 border-t border-border px-6 py-4 flex-row sm:justify-end">
          {canEdit && (
            <AppButton variant="outline" size="sm" asChild>
              <Link href={ROUTES.USER_EDIT(user.id)} onClick={() => onOpenChange(false)}>
                Edit
              </Link>
            </AppButton>
          )}
          <AppButton variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
