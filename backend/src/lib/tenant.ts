/**
 * Tenant isolation: always scope queries by agencyId for tenant-scoped resources.
 * Use in repositories: where: { ...tenantScope(agencyId), ...rest }
 * Controllers get agencyId from req.user.agencyId (after requireTenant).
 */

export function tenantScope(agencyId: string | null): { agencyId: string } | Record<string, never> {
  if (agencyId == null) return {};
  return { agencyId };
}
