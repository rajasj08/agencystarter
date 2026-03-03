import type { PrismaClient } from "@prisma/client";

/**
 * Base repository. All repositories extend this.
 * Encapsulates Prisma; controllers never use Prisma directly.
 *
 * For models with soft delete (deletedAt), use activeOnly() in where clauses
 * so active rows are filtered consistently (findManyActive / findActiveById pattern).
 */
export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaClient) {}

  /** Use in where clause for soft-delete models: where: { ...this.activeOnly(), ...rest } */
  protected activeOnly(): { deletedAt: null } {
    return { deletedAt: null };
  }
}
