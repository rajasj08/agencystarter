import crypto from "node:crypto";
import { apiKeyRepository } from "../../lib/data-access.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { audit } from "../../lib/audit.js";

const KEY_PREFIX = "ak_";
const KEY_BYTES = 32;

function hashKey(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

function generatePlainKey(): string {
  return KEY_PREFIX + crypto.randomBytes(KEY_BYTES).toString("hex");
}

/** Ensure permission keys are valid tenant permissions or platform if agencyId is null. */
function validatePermissionKeys(permissionKeys: string[], isPlatform: boolean): string[] {
  const allowed = new Set<string>(Object.values(PERMISSIONS));
  const out: string[] = [];
  for (const k of permissionKeys) {
    if (!allowed.has(k)) continue;
    if (k === PERMISSIONS.ADMIN_ALL && !isPlatform) continue; // admin:all only for platform keys
    out.push(k);
  }
  return [...new Set(out)];
}

export interface CreateApiKeyInput {
  name?: string | null;
  permissionKeys: string[];
  expiresAt?: Date | null;
}

export interface ApiKeyDTO {
  id: string;
  name: string | null;
  permissionKeys: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export class ApiKeyService {
  async create(
    req: AuthRequest,
    agencyId: string | null,
    input: CreateApiKeyInput
  ): Promise<{ key: string; apiKey: ApiKeyDTO }> {
    const isPlatform = agencyId === null;
    if (!isPlatform && !req.user?.agencyId) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Tenant context required for tenant API keys", 403);
    }
    if (isPlatform && !req.user?.isSuperAdmin) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Platform API keys require superadmin", 403);
    }
    if (isPlatform === false && req.user!.agencyId !== agencyId) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Cannot create API key for another tenant", 403);
    }

    const normalized = validatePermissionKeys(input.permissionKeys, isPlatform);
    if (normalized.length === 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "At least one valid permission is required", 400);
    }

    const plainKey = generatePlainKey();
    const keyHash = hashKey(plainKey);
    const created = await apiKeyRepository.create({
      agencyId,
      name: input.name ?? null,
      keyHash,
      permissionKeys: normalized,
      expiresAt: input.expiresAt ?? null,
      createdById: req.user!.userId,
    });

    await audit(req, {
      action: "api_key.created",
      resource: "api_key",
      resourceId: created.id,
      details: { name: created.name, agencyId, permissionCount: normalized.length },
    });

    return {
      key: plainKey,
      apiKey: {
        id: created.id,
        name: created.name,
        permissionKeys: normalized,
        expiresAt: created.expiresAt?.toISOString() ?? null,
        lastUsedAt: created.lastUsedAt?.toISOString() ?? null,
        createdAt: created.createdAt.toISOString(),
      },
    };
  }

  async validateAndAttach(plainKey: string): Promise<{
    userId: string;
    agencyId: string | null;
    scope: "platform" | "tenant";
    permissions: string[];
    isSuperAdmin: boolean;
    isApiKey: true;
    apiKeyId: string;
  } | null> {
    const keyHash = hashKey(plainKey);
    const row = await apiKeyRepository.findByKeyHash(keyHash);
    if (!row) return null;

    const permissions = Array.isArray(row.permissionKeys)
      ? (row.permissionKeys as string[])
      : [];
    const isPlatform = row.agencyId === null;

    await apiKeyRepository.updateLastUsedAt(row.id);

    return {
      userId: row.createdById,
      agencyId: row.agencyId,
      scope: isPlatform ? "platform" : "tenant",
      permissions,
      isSuperAdmin: isPlatform && permissions.includes(PERMISSIONS.ADMIN_ALL),
      isApiKey: true,
      apiKeyId: row.id,
    };
  }

  async revoke(req: AuthRequest, id: string, agencyId: string | null): Promise<void> {
    const isPlatform = agencyId === null;
    if (isPlatform && !req.user?.isSuperAdmin) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Only superadmin can revoke platform API keys", 403);
    }
    if (!isPlatform && req.user!.agencyId !== agencyId) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Cannot revoke API key of another tenant", 403);
    }

    const found = await apiKeyRepository.findByIdAndScope(id, agencyId);
    if (!found) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "API key not found", 404);
    }
    if (found.revokedAt) {
      throw new AppError(ERROR_CODES.API_KEY_REVOKED, "API key is already revoked", 400);
    }

    const ok = await apiKeyRepository.revoke(id, agencyId);
    if (!ok) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to revoke API key", 500);
    }

    await audit(req, {
      action: "api_key.revoked",
      resource: "api_key",
      resourceId: id,
      details: { agencyId },
    });
  }

  async rotate(req: AuthRequest, id: string, agencyId: string | null, input: CreateApiKeyInput): Promise<{ key: string; apiKey: ApiKeyDTO }> {
    const created = await this.create(req, agencyId, input);
    await this.revoke(req, id, agencyId);
    await audit(req, {
      action: "api_key.rotated",
      resource: "api_key",
      resourceId: id,
      details: { newKeyId: created.apiKey.id, agencyId },
    });
    return created;
  }

  async list(agencyId: string | null): Promise<ApiKeyDTO[]> {
    const rows =
      agencyId === null
        ? await apiKeyRepository.listPlatform()
        : await apiKeyRepository.listByAgency(agencyId);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      permissionKeys: Array.isArray(r.permissionKeys) ? (r.permissionKeys as string[]) : [],
      expiresAt: r.expiresAt?.toISOString() ?? null,
      lastUsedAt: r.lastUsedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
