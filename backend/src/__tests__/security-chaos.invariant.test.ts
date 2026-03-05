/**
 * Negative / chaos security tests. Assert that injection, tampering, and
 * invalid input are rejected. Run with: npm run test
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

describe("Security chaos / negative", () => {
  let app: ReturnType<typeof createApp>;
  let fixtures: InvariantFixtures;
  const tenantAdminPassword = "SeedPassword1!";

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    app = createApp();
    fixtures = await ensureInvariantTestData();
  }, 20_000);

  it("rejects random agencyId injection (body/query ignored; scope from JWT)", async () => {
    const login = await supertest(app)
      .post(`${fixtures.apiPrefix}/auth/login`)
      .send({ email: fixtures.userAEmail, password: tenantAdminPassword })
      .expect(200);

    const accessToken = (login.body as { data?: { accessToken?: string } }).data?.accessToken;
    expect(accessToken).toBeDefined();

    const listWithInjectedAgency = await supertest(app)
      .get(`${fixtures.apiPrefix}/users`)
      .query({ agencyId: fixtures.agencyBId })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const data = (listWithInjectedAgency.body as { data?: { agencyId?: string }[] }).data ?? [];
    for (const user of data) {
      expect(user.agencyId).toBe(fixtures.agencyAId);
    }

    const bodyInjected = await supertest(app)
      .post(`${fixtures.apiPrefix}/users`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        email: "new@test.local",
        password: "Pass1!word",
        role: "USER",
        agencyId: fixtures.agencyBId,
      });

    if (bodyInjected.status === 200 || bodyInjected.status === 201) {
      const created = (bodyInjected.body as { data?: { agencyId?: string } }).data;
      expect(created?.agencyId).toBe(fixtures.agencyAId);
    }
  });

  it("rejects tampered JWT", async () => {
    const login = await supertest(app)
      .post(`${fixtures.apiPrefix}/auth/login`)
      .send({ email: fixtures.userAEmail, password: tenantAdminPassword })
      .expect(200);

    const accessToken = (login.body as { data?: { accessToken?: string } }).data?.accessToken;
    expect(accessToken).toBeDefined();

    const tampered = accessToken!.slice(0, -2) + (accessToken!.slice(-1) === "a" ? "b" : "a");
    await supertest(app)
      .get(`${fixtures.apiPrefix}/auth/me`)
      .set("Authorization", `Bearer ${tampered}`)
      .expect(401);
  });

  it("rejects expired refresh token replay", async () => {
    const login = await supertest(app)
      .post(`${fixtures.apiPrefix}/auth/login`)
      .send({ email: fixtures.userAEmail, password: tenantAdminPassword })
      .expect(200);

    const refreshToken = (login.body as { data?: { refreshToken?: string } }).data?.refreshToken;
    expect(refreshToken).toBeDefined();

    const prisma = getPrismaForInternalUse();
    const crypto = await import("node:crypto");
    const hash = crypto.createHash("sha256").update(refreshToken!).digest("hex");
    const session = await prisma.session.findFirst({
      where: { refreshTokenHash: hash },
      select: { id: true },
    });
    expect(session).toBeDefined();

    await prisma.session.update({
      where: { id: session!.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    await supertest(app)
      .post(`${fixtures.apiPrefix}/auth/refresh`)
      .send({ refreshToken })
      .expect(401);

    await prisma.session.deleteMany({ where: { id: session!.id } });
  });

  it("rejects invalid CIDR in ipAllowlist", async () => {
    const login = await supertest(app)
      .post(`${fixtures.apiPrefix}/auth/login`)
      .send({ email: fixtures.userAEmail, password: tenantAdminPassword })
      .expect(200);

    const accessToken = (login.body as { data?: { accessToken?: string } }).data?.accessToken;
    expect(accessToken).toBeDefined();

    await supertest(app)
      .patch(`${fixtures.apiPrefix}/settings`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ipAllowlist: ["not-a-cidr", "256.256.0.0/24", "192.168.1.0/33"] })
      .expect(400);
  });

  it("permission removal invalidates next request (version bump)", async () => {
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
    const originalVersion = role!.permissionsVersion ?? 1;

    await prisma.role.update({
      where: { id: role!.id },
      data: { permissionsVersion: originalVersion + 1 },
    });

    await supertest(app)
      .get(`${fixtures.apiPrefix}/users`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(401);

    await prisma.role.update({
      where: { id: role!.id },
      data: { permissionsVersion: originalVersion },
    });
  });
});
