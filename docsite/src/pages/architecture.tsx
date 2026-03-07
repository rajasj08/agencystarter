import { DocsLayout } from "@/components/docs/DocsLayout";

export default function ArchitecturePage() {
  return (
    <DocsLayout>
      <h1>Architecture</h1>
      <p>
        High-level structure of the application: backend modules, frontend app, and
        how multi-tenancy and permissions are enforced.
      </p>

      <h2>Stack</h2>
      <ul>
        <li>
          <strong>Frontend</strong> — Next.js (App Router), React, TypeScript,
          Tailwind CSS
        </li>
        <li>
          <strong>Backend</strong> — Node.js, Express, TypeScript, Prisma
        </li>
        <li>
          <strong>Database</strong> — PostgreSQL
        </li>
      </ul>

      <h2>Repository layout</h2>
      <pre>
        <code>{`agencystarter/
├── backend/
│   ├── prisma/           # Schema and migrations
│   └── src/
│       ├── api/         # Express app, router
│       ├── config/      # Env and config
│       ├── modules/     # Auth, users, agencies, SSO, superadmin, etc.
│       ├── middleware/  # Auth, RBAC, tenant scope
│       └── lib/         # Data access, audit, mail
├── frontend/
│   └── src/
│       ├── app/         # Routes (dashboard, login, superadmin, agency login)
│       ├── components/
│       ├── store/       # Auth state
│       └── services/    # API clients
├── docsite/             # This documentation site
└── docs/                # Markdown docs (design, SSO, etc.)`}</code>
      </pre>

      <h2>Multi-tenancy</h2>
      <p>
        Tenants are <strong>agencies</strong>. Each agency has its own users, roles,
        and settings. Backend APIs that are tenant-scoped require an authenticated
        user and enforce <code>agencyId</code> so that users only access their
        agency’s data. Platform-level actions (e.g. superadmin) use a separate
        scope and role.
      </p>

      <h2>Auth and permissions</h2>
      <p>
        JWT access and refresh tokens carry <code>userId</code>, <code>agencyId</code>,
        and <code>role</code>. Permissions are resolved from the role and checked in
        middleware or services. Superadmin (platform) role bypasses tenant
        restrictions for designated routes.
      </p>
    </DocsLayout>
  );
}
