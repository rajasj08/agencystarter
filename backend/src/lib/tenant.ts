import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

/**
 * Tenant isolation: scope queries by agencyId for tenant-scoped resources.
 * Use in repositories: where: { ...tenantScope(agencyId), ...rest }
 *
 * Controllers get agencyId from req.user.agencyId after requireTenant (tenant routes).
 * Do NOT pass null for tenant-scoped routes; requireTenant ensures agencyId is set.
 * SUPER_ADMIN with agencyId=null must not use tenant-scoped APIs; they use superadmin
 * routes where agencyId comes from the URL (explicit selection), never injected as null.
 *
 * Convention: Tenant repositories must not expose raw findById(id) for tenant-scoped resources.
 * Use findByIdAndAgency(id, agencyId), findByIdScoped, updateScoped, deleteScoped (or equivalent)
 * so that agencyId is always part of the query.
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

/**
 * Runtime guard: assert that a resource belongs to the expected agency (defense in depth).
 * Call after fetching a tenant-scoped resource to catch repo bugs or misuse.
 * @throws AppError 403 if resource.agencyId !== expectedAgencyId
 */
export function assertAgencyScoped(
  resource: { agencyId: string | null },
  expectedAgencyId: string,
  message = "Cross-tenant access"
): void {
  if (resource.agencyId !== expectedAgencyId) {
    throw new AppError(ERROR_CODES.PERMISSION_DENIED, message, 403);
  }
}
