"use client";

import { useState, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { AgencyAutocomplete } from "@/components/superadmin/AgencyAutocomplete";
import { getAgencyRoles } from "@/services/superadmin";

/** Form shape expected when this field is used: agencyId (optional) and roleValue. */
export interface AgencyRoleFormValues {
  agencyId?: string;
  roleValue: string;
}

export interface AgencyRoleFieldProps {
  /** Optional error message for the agency field. */
  agencyError?: string;
}

/**
 * Agency autocomplete + role select. Fetches roles for the selected agency internally.
 * Must be rendered inside a FormProvider with form values that include agencyId and roleValue.
 */
export function AgencyRoleField({ agencyError }: AgencyRoleFieldProps = {}) {
  const { setValue, control } = useFormContext<AgencyRoleFormValues>();
  const [agencyId, setAgencyId] = useState("");
  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const fetchIdRef = useRef(0);

  function handleAgencyChange(id: string) {
    setValue("agencyId", id, { shouldValidate: true });
    setValue("roleValue", "", { shouldValidate: false });
    setAgencyId(id);
    setRoleOptions([]);

    if (!id) {
      setRolesLoading(false);
      return;
    }

    const reqId = ++fetchIdRef.current;
    setRolesLoading(true);

    getAgencyRoles(id)
      .then((roles) => {
        if (reqId !== fetchIdRef.current) return;
        setRoleOptions(roles.map((r) => ({ value: r.name, label: r.name })));
      })
      .catch((err: unknown) => {
        console.error("[AgencyRoleField] Failed to load roles:", err);
        if (reqId === fetchIdRef.current) setRoleOptions([]);
      })
      .finally(() => {
        if (reqId === fetchIdRef.current) setRolesLoading(false);
      });
  }

  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium text-text-primary">
          Agency <span className="text-danger">*</span>
        </label>
        <AgencyAutocomplete
          value={agencyId}
          onChange={handleAgencyChange}
          placeholder="Select agency"
          activeOnly
          error={agencyError}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-text-primary">
          Role <span className="text-danger">*</span>
        </label>

        {rolesLoading ? (
          <div className="flex h-10 w-full items-center rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-text-secondary">
            Loading roles…
          </div>
        ) : (
          <Controller
            key={`role-${agencyId}-${roleOptions.length}`}
            control={control}
            name="roleValue"
            render={({ field, fieldState }) => (
              <>
                <select
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  disabled={!agencyId || roleOptions.length === 0}
                  className={cn(
                    "flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
                    fieldState.error && "border-danger focus:ring-danger"
                  )}
                >
                  <option value="">
                    {!agencyId
                      ? "Select agency first"
                      : roleOptions.length === 0
                        ? "No roles available"
                        : "Select role"}
                  </option>
                  {roleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {fieldState.error && (
                  <p className="text-sm text-danger">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        )}
      </div>
    </>
  );
}
