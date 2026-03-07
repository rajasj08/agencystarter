import { DocsLayout } from "@/components/docs/DocsLayout";

export default function DocsIndexPage() {
  return (
    <DocsLayout>
      <h1>Introduction</h1>
      <p>
        Agency Starter is a multi-tenant application platform with agency (tenant)
        isolation, role-based access, and optional OpenID Connect (OIDC) single
        sign-on. This documentation helps developers set up, extend, and operate the
        system.
      </p>

      <h2>What’s included</h2>
      <ul>
        <li>
          <strong>Multi-tenancy</strong> — Agencies with isolated data and
          configurable plans
        </li>
        <li>
          <strong>Authentication</strong> — Email/password and optional OIDC SSO
          per agency
        </li>
        <li>
          <strong>Roles & permissions</strong> — Tenant and platform-level RBAC
        </li>
        <li>
          <strong>Superadmin</strong> — Platform management for agencies, users,
          and system settings
        </li>
      </ul>

      <h2>Tech stack</h2>
      <p>
        The project uses Next.js (frontend), Node.js + Express (backend), PostgreSQL,
        and Prisma. The docsite you’re reading is a separate Next.js app in{" "}
        <code>docsite/</code>; the main app and API live in <code>frontend/</code> and{" "}
        <code>backend/</code>.
      </p>

      <h2>Next steps</h2>
      <p>
        <a href="/getting-started">Getting Started</a> walks through installation
        and running the app. <a href="/architecture">Architecture</a> outlines
        structure and data flow. <a href="/auth-sso">Auth & SSO</a> covers login
        flows and OIDC configuration.
      </p>
    </DocsLayout>
  );
}
