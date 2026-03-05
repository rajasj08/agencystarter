/**
 * Tenant isolation: scope queries by agencyId for tenant-scoped resources.
 * Use in repositories: where: { ...tenantScope(agencyId), ...rest }
 *
 * Controllers get agencyId from req.user.agencyId after requireTenant (tenant routes).
 * Do NOT pass null for tenant-scoped routes; requireTenant ensures agencyId is set.
 * SUPER_ADMIN with agencyId=null must not use tenant-scoped APIs; they use superadmin
 * routes where agencyId comes from the URL (explicit selection), never injected as null.
 */
export function tenantScope(agencyId: string | null): { agencyId: string } | Record<string, never> {
  if (agencyId == null) return {};
  return { agencyId };
}

/**
 * Strict tenant scope for tenant-only repositories. Use wherever agencyId must be set.
 * Caller must pass agencyId: string (never undefined/null) so one unscoped call = boundary breach is impossible.
 */
export function tenantScopeStrict(agencyId: string): { agencyId: string } {
  return { agencyId };
}
