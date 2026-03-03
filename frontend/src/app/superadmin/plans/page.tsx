"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPlans, deletePlan, updatePlan, type Plan } from "@/services/superadmin";
import { ROUTES } from "@/constants/routes";
import { toast } from "@/lib/toast";
import { Pencil, Trash2, Plus, Star } from "lucide-react";

function getApiErrorMessage(err: unknown, fallback: string): string {
  const res = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return res ?? (err instanceof Error ? err.message : fallback);
}

export default function SuperadminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultConfirmPlan, setDefaultConfirmPlan] = useState<Plan | null>(null);
  const [settingDefault, setSettingDefault] = useState(false);
  const [deleteConfirmPlan, setDeleteConfirmPlan] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState(false);

  function loadPlans() {
    setLoading(true);
    getPlans()
      .then((list) => setPlans(list))
      .catch(() => toast.error("Failed to load plans"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadPlans();
  }, []);

  async function handleDelete(planId: string) {
    setDeleting(true);
    try {
      await deletePlan(planId);
      setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, isActive: false } : p)));
      setDeleteConfirmPlan(null);
      toast.success("Plan deactivated.");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to deactivate plan"));
    } finally {
      setDeleting(false);
    }
  }

  async function handleSetDefault(plan: Plan) {
    setSettingDefault(true);
    try {
      await updatePlan(plan.id, { isDefault: true });
      setPlans((prev) =>
        prev.map((p) => ({
          ...p,
          isDefault: p.id === plan.id,
        }))
      );
      setDefaultConfirmPlan(null);
      toast.success(`${plan.name} is now the default plan.`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Failed to set default plan"));
    } finally {
      setSettingDefault(false);
    }
  }

  return (
    <PageContainer title="Plans">
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <AppButton asChild>
            <Link href={ROUTES.SUPERADMIN_PLANS_CREATE}>
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Create Plan
            </Link>
          </AppButton>
        </div>
        <AppCard className="rounded-xl">
          {loading ? (
            <p className="text-text-secondary">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Custom</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-text-secondary">
                      No plans defined.
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-mono text-sm">{plan.code}</TableCell>
                      <TableCell>{plan.name}</TableCell>
                      <TableCell className="text-text-secondary">{plan.price}</TableCell>
                      <TableCell>
                        <span
                          className={
                            plan.isActive
                              ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                              : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-text-secondary"
                          }
                        >
                          {plan.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => !plan.isDefault && setDefaultConfirmPlan(plan)}
                          className="rounded-md p-1 hover:bg-muted focus:outline-none focus:ring-0"
                          title={plan.isDefault ? "Default plan" : "Set as default"}
                          aria-label={plan.isDefault ? "Default plan" : "Set as default"}
                        >
                          <Star
                            className={`h-5 w-5 ${plan.isDefault ? "fill-amber-400 text-amber-500" : "fill-none text-muted-foreground hover:text-amber-500"}`}
                          />
                        </button>
                      </TableCell>
                      <TableCell>{plan.isCustom ? "Yes" : "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link
                            href={ROUTES.SUPERADMIN_PLAN_EDIT(plan.id)}
                            title="Edit plan"
                            className="rounded-md p-2 text-text-secondary hover:bg-muted hover:text-text-primary"
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </Link>
                          <button
                            type="button"
                            title="Deactivate plan"
                            className="rounded-md p-2 text-text-secondary hover:bg-muted hover:text-text-primary"
                            onClick={() => plan.isActive && setDeleteConfirmPlan(plan)}
                            disabled={!plan.isActive}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </AppCard>
      </div>
      <Dialog open={!!defaultConfirmPlan} onOpenChange={(open) => !open && setDefaultConfirmPlan(null)}>
        <DialogContent showClose={!settingDefault}>
          <DialogHeader>
            <DialogTitle>Set as default plan?</DialogTitle>
            <DialogDescription>
              {defaultConfirmPlan && (
                <>
                  <strong>{defaultConfirmPlan.name}</strong> will become the default plan. The current default will be
                  unset. New agencies can be assigned this plan automatically. Continue?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <AppButton
              type="button"
              variant="outline"
              onClick={() => setDefaultConfirmPlan(null)}
              disabled={settingDefault}
            >
              Cancel
            </AppButton>
            <AppButton
              type="button"
              onClick={() => defaultConfirmPlan && handleSetDefault(defaultConfirmPlan)}
              loading={settingDefault}
              disabled={!defaultConfirmPlan}
            >
              Set as default
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteConfirmPlan} onOpenChange={(open) => !open && setDeleteConfirmPlan(null)}>
        <DialogContent showClose={!deleting}>
          <DialogHeader>
            <DialogTitle>Deactivate plan?</DialogTitle>
            <DialogDescription>
              {deleteConfirmPlan && (
                <>
                  Deactivate <strong>{deleteConfirmPlan.name}</strong>? The plan will be marked inactive. Agencies
                  already using it will keep their current plan. You cannot delete a plan that is in use.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <AppButton
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmPlan(null)}
              disabled={deleting}
            >
              Cancel
            </AppButton>
            <AppButton
              type="button"
              variant="danger"
              onClick={() => deleteConfirmPlan && handleDelete(deleteConfirmPlan.id)}
              loading={deleting}
              disabled={!deleteConfirmPlan}
            >
              Deactivate
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

