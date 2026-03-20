/**
 * Security invariant tests. Not feature tests — they assert that security
 * boundaries cannot be violated. Run with: npm run test
 *
 * Requires: DB migrated and seeded (npm run db:migrate && npm run db:seed).
 */

import "dotenv/config";
import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import { createApp } from "../app.js";
import { getPrismaForInternalUse } from "../lib/data-access.js";
import {
  ensureInvariantTestData,
  INVARIANT_PASSWORD,
  type InvariantFixtures,
} from "./setup-invariants.js";
import { audit } from "../lib/audit.js";

describe("Security invariants", () => {
  let app: ReturnType<typeof createApp>;
  let fixtures: InvariantFixtures;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    app = createApp();
    fixtures = await ensureInvariantTestData();
  }, 20_000);

  const tenantAdminPassword = "SeedPassword1!";

  it("Tenant A cannot fetch Tenant B data (forcefully)", async () => {
    const login = await supertest(app)
      .post(`${fixtures.apiPrefix}/auth/login`)
      .send({ email: fixtures.userAEmail, password: tenantAdminPassword })
      .expect(200);

    const accessToken = (login.body as { data?: { accessToken?: string } }).data?.accessToken;
    expect(accessToken).toBeDefined();

    const listRes = await supertest(app)
      .get(`${fixtures.apiPrefix}/users`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const data = (listRes.body as { data?: { id?: string; agencyId?: string }[] }).data ?? [];
    for (const user of data) {
      expect(user.agencyId).toBe(fixtures.agencyAId);
    }

    const getOther = await supertest(app)
      .get(`${fixtures.apiPrefix}/users/${fixtures.userBId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);

    expect((getOther.body as { success: boolean }).success).toBe(false);
  });

  it("Tenant admin cannot hit platform export", async () => {
    const login = await supertest(app)
      .post(`${fixtures.apiPrefix}/auth/login`)
      .send({ email: fixtures.userAEmail, password: tenantAdminPassword })
      .expect(200);

    const accessToken = (login.body as { data?: { accessToken?: string } }).data?.accessToken;
    expect(accessToken).toBeDefined();

    await supertest(app)
      .get(`${fixtures.apiPrefix}/superadmin/audit/export`)
      .query({ format: "json", limit: 10 })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(403);
  });

  it("Revoked API key fails immediately", async () => {
    const login = await supertest(app)
      .post(`${fixtures.apiPrefix}/auth/login`)
      .send({ email: fixtures.superadminEmail, password: "SeedPassword1!" })
      .expect(200);

    const accessToken = (login.body as { data?: { accessToken?: string } }).data?.accessToken;
    expect(accessToken).toBeDefined();

    const createKey = await supertest(app)
      .post(`${fixtures.apiPrefix}/superadmin/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "invariant-revoke-test", permissionKeys: ["admin:all"] })
      .expect(200);

    const key = (createKey.body as { data?: { key?: string; apiKey?: { id: string } } }).data?.key;
    const keyId = (createKey.body as { data?: { apiKey?: { id: string } } }).data?.apiKey?.id;
    expect(key).toBeDefined();
    expect(keyId).toBeDefined();

    await supertest(app)
      .post(`${fixtures.apiPrefix}/superadmin/api-keys/${keyId}/revoke`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    await supertest(app)
      .get(`${fixtures.apiPrefix}/superadmin/system-settings`)
      .set("Authorization", `ApiKey ${key}`)
      .expect(401);
  });

  it("Platform API key without admin:all cannot access superadmin endpoints", async () => {
    const login = await supertest(app)
      .post(`${fixtures.apiPrefix}/auth/login`)
      .send({ email: fixtures.superadminEmail, password: "SeedPassword1!" })
      .expect(200);
    const accessToken = (login.body as { data?: { accessToken?: string } }).data?.accessToken;
    expect(accessToken).toBeDefined();

    const createKey = await supertest(app)
      .post(`${fixtures.apiPrefix}/superadmin/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "invariant-limited-platform-key", permissionKeys: ["agency:list"] })
      .expect(200);
    const key = (createKey.body as { data?: { key?: string } }).data?.key;
    expect(key).toBeDefined();

    await supertest(app)
      .get(`${fixtures.apiPrefix}/superadmin/system-settings`)
      .set("Authorization", `ApiKey ${key}`)
      .expect(403);
  });

  it("Parallel superadmin disable attempts are both denied and invariant holds", async () => {
    const login = await supertest(app)
      .post(`${fixtures.apiPrefix}/auth/login`)
      .send({ email: fixtures.superadminEmail, password: "SeedPassword1!" })
      .expect(200);
    const accessToken = (login.body as { data?: { accessToken?: string } }).data?.accessToken;
    expect(accessToken).toBeDefined();

    const createKey = await supertest(app)
      .post(`${fixtures.apiPrefix}/superadmin/api-keys`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "parallel-disable-test", permissionKeys: ["admin:all"] })
      .expect(200);
    const key = (createKey.body as { data?: { key?: string } }).data?.key;
    expect(key).toBeDefined();

    const [r1, r2] = await Promise.all([
      supertest(app)
        .patch(`${fixtures.apiPrefix}/superadmin/users/${fixtures.superadminId}/disable`)
        .set("Authorization", `ApiKey ${key}`),
      supertest(app)
        .patch(`${fixtures.apiPrefix}/superadmin/users/${fixtures.superadminId}/disable`)
        .set("Authorization", `ApiKey ${key}`),
    ]);
    expect(r1.status).toBe(403);
    expect(r2.status).toBe(403);

    const prisma = getPrismaForInternalUse();
    const superadmin = await prisma.user.findUnique({
      where: { id: fixtures.superadminId },
      select: { status: true, deletedAt: true },
    });
    expect(superadmin).toBeDefined();
    expect(superadmin!.deletedAt).toBeNull();
    expect(superadmin!.status).toBe("ACTIVE");
  });

  it("IP guard blocks disallowed CIDR", async () => {
    const login = await supertest(app)
      .post(`${fixtures.apiPrefix}/auth/login`)
      .send({ email: "invariant-ip-user@test.local", password: INVARIANT_PASSWORD })
      .expect(200);

    const accessToken = (login.body as { data?: { accessToken?: string } }).data?.accessToken;
    expect(accessToken).toBeDefined();

    await supertest(app)
      .get(`${fixtures.apiPrefix}/settings`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(403);
  });

  it("Permission version change invalidates session", async () => {
    const login = await supertest(app)
      .post(`${fixtures.apiPrefix}/auth/login`)
      .send({ email: fixtures.userAEmail, password: tenantAdminPassword })
      .expect(200);

    const accessToken = (login.body as { data?: { accessToken?: string } }).data?.accessToken;
    expect(accessToken).toBeDefined();

    const prisma = getPrismaForInternalUse();
    const role = await prisma.role.findFirst({
      where: { agencyId: fixtures.agencyAId, name: "AGENCY_ADMIN" },
      select: { id: true, permissionsVersion: true },
    });
    expect(role).toBeDefined();

    await prisma.role.update({
      where: { id: role!.id },
      data: { permissionsVersion: (role!.permissionsVersion ?? 1) + 1 },
    });

    const meRes = await supertest(app)
      .get(`${fixtures.apiPrefix}/auth/me`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(401);

    expect((meRes.body as { success: boolean }).success).toBe(false);

    await prisma.role.update({
      where: { id: role!.id },
      data: { permissionsVersion: role!.permissionsVersion ?? 1 },
    });
  });

  it("SSO routes return 404 when AUTH_SSO_ENABLED is false", async () => {
    const res = await supertest(app)
      .get(`${fixtures.apiPrefix}/auth/sso/oidc`)
      .query({ agencyId: "any", redirect_uri: "http://localhost:3000/cb" })
      .expect(404);
    expect((res.body as { success: boolean }).success).toBe(false);
    expect((res.body as { code?: string }).code).toBe("NOT_FOUND");
  });

  it("Audit enforces impersonation attribution from auth context", async () => {
    const prisma = getPrismaForInternalUse();
    const action = `invariant.audit.impersonation.${Date.now()}`;

    await audit(
      {
        user: {
          userId: fixtures.superadminId,
          agencyId: fixtures.agencyAId,
          role: "SUPER_ADMIN",
          isSuperAdmin: true,
          impersonation: true,
          scope: "tenant",
          isApiKey: false,
        },
        ip: "127.0.0.1",
        get: () => "vitest",
      } as never,
      {
        action,
        resource: "audit_test",
        resourceId: fixtures.agencyAId,
        details: { note: "payload attempts impersonation=false" },
        impersonation: false,
      }
    );

    const row = await prisma.auditLog.findFirst({
      where: { action },
      orderBy: { createdAt: "desc" },
      select: { userId: true, agencyId: true, impersonation: true, details: true },
    });

    expect(row).toBeDefined();
    expect(row!.userId).toBe(fixtures.superadminId);
    expect(row!.agencyId).toBe(fixtures.agencyAId);
    expect(row!.impersonation).toBe(true);
    expect((row!.details as { _actor?: { impersonation?: boolean } } | null)?._actor?.impersonation).toBe(
      true
    );
  });
});
