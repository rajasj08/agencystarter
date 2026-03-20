import "dotenv/config";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import supertest from "supertest";

describe("SSO security invariants", () => {
  const prevSso = process.env.AUTH_SSO_ENABLED;
  const prevApiPrefix = process.env.API_PREFIX;

  beforeAll(() => {
    process.env.NODE_ENV = "test";
    process.env.AUTH_SSO_ENABLED = "true";
    process.env.API_PREFIX = process.env.API_PREFIX || "/api/v1";
  });

  afterAll(() => {
    if (prevSso === undefined) delete process.env.AUTH_SSO_ENABLED;
    else process.env.AUTH_SSO_ENABLED = prevSso;
    if (prevApiPrefix === undefined) delete process.env.API_PREFIX;
    else process.env.API_PREFIX = prevApiPrefix;
  });

  it("rejects callback when state cookie is missing/mismatched", async () => {
    const { createApp } = await import("../app.js");
    const app = createApp();
    const apiPrefix = process.env.API_PREFIX || "/api/v1";
    const res = await supertest(app)
      .get(`${apiPrefix}/auth/sso/oidc/callback`)
      .query({ code: "dummy", state: "dummy-state" })
      .expect(302);

    const location = res.headers.location as string;
    expect(location).toContain("error=sso_failed");
    expect(location).toContain("Invalid+SSO+state");
  });
});

