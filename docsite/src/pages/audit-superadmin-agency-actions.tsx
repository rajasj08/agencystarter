import React from "react";
import { DocsLayout } from "@/components/docs/DocsLayout";

export default function AuditSuperadminAgencyActionsPage() {
  return (
    <DocsLayout>
      <h1>Audit: Superadmin disable, suspend, delete agency</h1>
      <p>
        What happens when a superadmin disables, suspends, or deletes an agency:
        how the status is changed and what is blocked. All entry points and tenant
        access now enforce agency status (hardened for production).
      </p>

      <h2>Ways to change agency status</h2>
      <ul>
        <li>
          <strong>Edit form:</strong> Superadmin → Agencies → Edit agency. Status dropdown: Active, Disabled, Suspended, Deleted. Submit calls <code>PATCH /superadmin/agencies/:id</code> with <code>status</code> in the body.
        </li>
        <li>
          <strong>Dedicated endpoints:</strong>
          <code>DELETE /superadmin/agencies/:id</code> → sets status to <code>DELETED</code>;
          <code>PATCH /superadmin/agencies/:id/suspend</code> → <code>SUSPENDED</code>;
          <code>PATCH /superadmin/agencies/:id/activate</code> → <code>ACTIVE</code>;
          <code>PATCH /superadmin/agencies/:id/status</code> with body <code>{`{ "status": "ACTIVE" | "DISABLED" | "SUSPENDED" | "DELETED" }`}</code>.
        </li>
      </ul>
      <p>
        All of these end up in <code>superadmin.service.updateAgencyStatus()</code>: only <code>Agency.status</code> and <code>updatedById</code> are updated in the DB. No user rows, sessions, or other data are modified.
      </p>

      <h2>What happens when status is not ACTIVE</h2>

      <h3>Login (email/password)</h3>
      <ul>
        <li>
          <strong>Agency login page</strong> (<code>/agency/:slug/login</code> with <code>agencySlug</code> in body): When the user submits, the backend resolves the agency by slug. If the agency is not found or <code>agency.status !== "ACTIVE"</code>, login returns <code>404 AGENCY_NOT_FOUND</code>. <strong>Blocked</strong> for disabled/suspended/deleted agencies.
        </li>
        <li>
          <strong>Generic login</strong> (e.g. <code>/login</code> with only email/password, no <code>agencySlug</code>): After validating the user, the backend loads the user’s agency and rejects with <code>403 AGENCY_NOT_ACTIVE</code> if <code>agency.status !== "ACTIVE"</code>. <strong>Blocked</strong> for non-active agencies.
        </li>
      </ul>

      <h3>Refresh token</h3>
      <p>
        <code>auth.service.refresh()</code> checks <code>user.deletedAt</code>, <code>user.status === "ACTIVE"</code>, and if the user has <code>agencyId</code>, loads the agency and rejects with <code>403 AGENCY_NOT_ACTIVE</code> when <code>agency.status !== "ACTIVE"</code>. The session is deleted. <strong>Blocked</strong>; existing sessions for a non-active agency fail on next refresh.
      </p>

      <h3>Tenant-scoped API routes</h3>
      <p>
        <code>requireTenant</code> (middleware) ensures <code>req.user.agencyId</code> is set and loads the agency; it rejects with <code>403 AGENCY_NOT_ACTIVE</code> if <code>agency.status !== "ACTIVE"</code>. So <strong>all tenant requests</strong> (dashboard, settings, users, roles, etc.) are blocked for disabled/suspended/deleted agencies. The frontend clears auth and redirects to login with <code>?reason=organization_unavailable</code> when it receives <code>AGENCY_NOT_ACTIVE</code>.
      </p>

      <h3>Impersonation (“Login as agency”)</h3>
      <p>
        <code>POST /superadmin/agencies/:id/login-as</code> (and the impersonate flow) explicitly checks <code>agency.status === "ACTIVE"</code>. If the agency is not ACTIVE, the backend returns <code>403 Cannot impersonate a disabled agency</code>. The UI disables the “Login as agency” button when <code>agency.status !== "ACTIVE"</code>.
      </p>

      <h3>Agency login page (public)</h3>
      <p>
        <code>GET /agencies/slug/:slug</code> (or equivalent used for the agency login page) is implemented as <code>agency.service.getBySlugForLogin()</code>: it returns 404 if the agency is not found or <code>agency.status !== "ACTIVE"</code>. So the <strong>agency-specific login page</strong> will not load for disabled/suspended/deleted agencies (e.g. “Agency not found”).
      </p>

      <h3>SSO</h3>
      <p>
        SSO initiate and callback use <code>getOidcConfigFromAgency()</code>, which now requires <code>agency.status === "ACTIVE"</code>. If not active, the backend returns <code>404 Not found</code> (no enumeration). <strong>Blocked</strong> for non-active agencies.
      </p>

      <h2>Summary table</h2>
      <table className="w-full border-collapse border border-docs-border text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-docs-border px-3 py-2 text-left font-semibold">Action / flow</th>
            <th className="border border-docs-border px-3 py-2 text-left font-semibold">Checks agency status?</th>
            <th className="border border-docs-border px-3 py-2 text-left font-semibold">Result when agency disabled/suspended/deleted</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-docs-border px-3 py-2">Superadmin set status</td>
            <td className="border border-docs-border px-3 py-2">—</td>
            <td className="border border-docs-border px-3 py-2">Only <code>Agency.status</code> (and <code>updatedById</code>) updated. No user/session changes.</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2">Login with agency slug</td>
            <td className="border border-docs-border px-3 py-2">Yes</td>
            <td className="border border-docs-border px-3 py-2">Blocked (404 Agency not found).</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2">Login without agency slug</td>
            <td className="border border-docs-border px-3 py-2">Yes</td>
            <td className="border border-docs-border px-3 py-2">Blocked (403 AGENCY_NOT_ACTIVE) if agency not ACTIVE.</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2">Refresh token</td>
            <td className="border border-docs-border px-3 py-2">Yes</td>
            <td className="border border-docs-border px-3 py-2">Blocked (403); session deleted. User must re-login; login will also block if agency not ACTIVE.</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2">Tenant API (dashboard, settings, users, roles…)</td>
            <td className="border border-docs-border px-3 py-2">Yes</td>
            <td className="border border-docs-border px-3 py-2">403 AGENCY_NOT_ACTIVE; frontend clears auth and redirects to login.</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2">Impersonate (login as agency)</td>
            <td className="border border-docs-border px-3 py-2">Yes</td>
            <td className="border border-docs-border px-3 py-2">Blocked (403). Button disabled in UI.</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2">Agency login page (resolve by slug)</td>
            <td className="border border-docs-border px-3 py-2">Yes</td>
            <td className="border border-docs-border px-3 py-2">404; page does not load.</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2">SSO initiate / callback</td>
            <td className="border border-docs-border px-3 py-2">Yes</td>
            <td className="border border-docs-border px-3 py-2">404 Not found when agency not ACTIVE (no enumeration).</td>
          </tr>
        </tbody>
      </table>

      <h2>Implemented hardening</h2>
      <p>
        All of the following are in place for production/enterprise use:
      </p>
      <ul>
        <li>
          <strong>Tenant middleware:</strong> <code>requireTenant</code> loads the agency and rejects with 403 <code>AGENCY_NOT_ACTIVE</code> when <code>agency.status !== "ACTIVE"</code>. All tenant routes use <code>asyncHandler(requireTenant)</code>.
        </li>
        <li>
          <strong>Login (generic):</strong> Before issuing tokens, if the user has <code>agencyId</code>, the agency is loaded and login is rejected with 403 <code>AGENCY_NOT_ACTIVE</code> when not ACTIVE.
        </li>
        <li>
          <strong>Refresh:</strong> If the user has <code>agencyId</code>, the agency is checked; refresh is rejected with 403 and the session is deleted when the agency is not ACTIVE.
        </li>
        <li>
          <strong>SSO:</strong> <code>getOidcConfigFromAgency()</code> requires <code>agency.status === "ACTIVE"</code> and returns 404 otherwise (initiate and callback).
        </li>
        <li>
          <strong>Frontend:</strong> On 403 with code <code>AGENCY_NOT_ACTIVE</code>, the client clears auth and redirects to <code>/login?reason=organization_unavailable</code>; the login page shows a message.
        </li>
      </ul>
    </DocsLayout>
  );
}
