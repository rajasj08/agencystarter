import type { PrismaClient } from "@prisma/client";
import { BaseRepository } from "../../core/BaseRepository.js";

export interface ApiKeyRow {
  id: string;
  agencyId: string | null;
  name: string | null;
  keyHash: string;
  permissionKeys: unknown;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdById: string;
  createdAt: Date;
}

export class ApiKeyRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /** Find by key hash for validation. Returns key if not revoked and not expired. */
  async findByKeyHash(keyHash: string): Promise<ApiKeyRow | null> {
    const row = await this.prisma.apiKey.findFirst({
      where: {
        keyHash,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    return row;
  }

  /** Tenant-scoped: find by id and agency (or platform key with agencyId null for superadmin). */
  async findByIdAndScope(id: string, agencyId: string | null): Promise<ApiKeyRow | null> {
    const row = await this.prisma.apiKey.findFirst({
      where:
        agencyId === null
          ? { id, agencyId: null }
          : { id, agencyId },
    });
    return row;
  }

  /** List keys for a tenant. */
  async listByAgency(agencyId: string): Promise<ApiKeyRow[]> {
    return this.prisma.apiKey.findMany({
      where: { agencyId, revokedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Platform: list all platform keys (agencyId null). */
  async listPlatform(): Promise<ApiKeyRow[]> {
    return this.prisma.apiKey.findMany({
      where: { agencyId: null, revokedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    agencyId: string | null;
    name: string | null;
    keyHash: string;
    permissionKeys: string[];
    expiresAt: Date | null;
    createdById: string;
  }) {
    return this.prisma.apiKey.create({
      data: {
        agencyId: data.agencyId,
        name: data.name,
        keyHash: data.keyHash,
        permissionKeys: data.permissionKeys as unknown as object,
        expiresAt: data.expiresAt,
        createdById: data.createdById,
      },
    });
  }

  /** Revoke by setting revokedAt. Tenant-scoped or platform by id + scope. */
  async revoke(id: string, agencyId: string | null): Promise<boolean> {
    const where =
      agencyId === null
        ? { id, agencyId: null }
        : { id, agencyId };
    const updated = await this.prisma.apiKey.updateMany({
      where,
      data: { revokedAt: new Date() },
    });
    return updated.count > 0;
  }

  async updateLastUsedAt(id: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }
}
