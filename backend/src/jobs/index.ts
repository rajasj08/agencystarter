/**
 * Background jobs placeholder. Add cron/scheduled tasks here.
 *
 * Tenant rule: any job that reads or writes tenant-scoped data (users, roles, agency settings, etc.)
 * must receive agencyId (e.g. from a job payload or queue message) and pass it into repository
 * methods. Never run prisma.user.findMany(), prisma.role.findMany(), etc. without agencyId
 * in the where clause for tenant data. Background tasks are a common cross-tenant leak vector.
 */
