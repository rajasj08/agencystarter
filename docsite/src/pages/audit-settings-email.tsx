import React from "react";
import { DocsLayout } from "@/components/docs/DocsLayout";

export default function AuditSettingsEmailPage() {
  return (
    <DocsLayout>
      <h1>Audit: Dashboard Settings → Email</h1>
      <p>
        How <code>/dashboard/settings/email</code> works: UI, API, where settings are stored,
        how test email and agency SMTP are used.
      </p>

      <h2>Page and route</h2>
      <ul>
        <li>
          <strong>URL:</strong> <code>http://localhost:3000/dashboard/settings/email</code>
        </li>
        <li>
          <strong>Page component:</strong> <code>frontend/src/app/dashboard/settings/email/page.tsx</code> — wraps <code>EmailSettingsForm</code> in <code>PageContainer</code>.
        </li>
        <li>
          <strong>Layout:</strong> Under <code>dashboard/settings/layout.tsx</code>, so the Settings tabs (General, User Management, Email, Email Templates, Security) are shown.
        </li>
        <li>
          <strong>Access:</strong> Authenticated tenant user with <code>SETTINGS_READ</code> / <code>SETTINGS_UPDATE</code> or <code>ADMIN_ALL</code>. Superadmin is redirected to <code>/superadmin</code>, so this page is agency-only.
        </li>
      </ul>

      <h2>Form: what’s on the page</h2>
      <p>
        <code>EmailSettingsForm</code> (<code>frontend/src/modules/settings/components/EmailSettingsForm.tsx</code>) has two blocks:
      </p>
      <ol>
        <li>
          <strong>SMTP card</strong> — Host, Port, Username, Password (optional; leave blank to keep existing), Sender name, Sender email. These are stored in the agency’s settings and, when present, are used as the agency’s SMTP config for sending.
        </li>
        <li>
          <strong>Test email card</strong> — “Send test to” input + “Send test email” button. Independent of the form submit; calls <code>POST /settings/test-email</code> with <code>{`{ "to": "…" }`}</code>.
        </li>
      </ol>
      <p>
        Submit saves via <code>PATCH /settings</code> with the form payload (SMTP fields). Password is only sent when the user typed something (otherwise “leave blank to keep existing”).
      </p>

      <h2>API and backend</h2>
      <table className="w-full border-collapse border border-docs-border text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-docs-border px-3 py-2 text-left font-semibold">Action</th>
            <th className="border border-docs-border px-3 py-2 text-left font-semibold">HTTP</th>
            <th className="border border-docs-border px-3 py-2 text-left font-semibold">Backend</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-docs-border px-3 py-2">Load settings</td>
            <td className="border border-docs-border px-3 py-2"><code>GET /api/v1/settings</code></td>
            <td className="border border-docs-border px-3 py-2"><code>SettingsController.get</code> → <code>SettingsService.get(agencyId)</code>. Returns merged agency identity + <code>agency.settings</code> (with defaults). <code>smtpPassword</code> is never returned.</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2">Save settings</td>
            <td className="border border-docs-border px-3 py-2"><code>PATCH /api/v1/settings</code></td>
            <td className="border border-docs-border px-3 py-2">Validated with <code>updateSettingsSchema</code>. Identity fields (e.g. name, contact) go to <code>Agency</code> table; SMTP goes into <code>Agency.settings</code> (JSON). Audit: <code>settings.updated</code>.</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2">Send test email</td>
            <td className="border border-docs-border px-3 py-2"><code>POST /api/v1/settings/test-email</code> body: <code>{`{ "to": "email@example.com" }`}</code></td>
            <td className="border border-docs-border px-3 py-2"><code>SettingsController.sendTestEmail</code> → <code>SettingsService.sendTestEmail(agencyId, to)</code> → <code>{`dispatchEmail({ template: "test", to, agencyId, variables: { appName } })`}</code>. Uses <strong>agency SMTP</strong> if the agency has <code>smtpHost</code> set (and <code>smtpEnabled</code> is not explicitly <code>false</code>); otherwise system SMTP from env.</td>
          </tr>
        </tbody>
      </table>

      <h2>Test email flow (step-by-step)</h2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>User enters an address in “Send test to” and clicks “Send test email”.</li>
        <li>Frontend calls <code>sendTestEmail(to)</code> → <code>POST /settings/test-email</code> with <code>{`{ to }`}</code>.</li>
        <li>Backend resolves <code>agencyId</code> from the authenticated user (tenant).</li>
        <li><code>SettingsService.sendTestEmail(agencyId, to)</code> calls <code>dispatchEmail</code> with <code>template: "test"</code> and <code>agencyId</code>.</li>
        <li><code>sendEmail</code> (in email.service) calls <code>resolveEmailSender(agencyId)</code>: if the agency has <code>smtpHost</code> in settings (and <code>smtpEnabled</code> is not <code>false</code>), the agency’s SMTP config (host, port, user, pass, sender name/email) is used; otherwise the system SMTP from <code>backend/.env</code> (e.g. <code>SMTP_HOST</code>, <code>SMTP_FROM</code>) is used.</li>
        <li>The “test” template is rendered (inline subject + body, no HTML file) with <code>appName</code>. Mail is sent via the chosen transporter. Success/failure is returned; frontend shows a toast.</li>
      </ol>
      <p>
        So the test email is the best way to verify that the SMTP fields you saved on this page are correct: it sends through the same resolution as other agency-scoped emails (invitation, admin password reset).
      </p>

      <h2>Who uses agency SMTP vs system SMTP?</h2>
      <p>
        Sender resolution is in <code>backend/src/modules/email/services/sender-resolver.ts</code>:
      </p>
      <ul>
        <li>If <code>agencyId</code> is passed and the agency has SMTP configured (host set, and <code>smtpEnabled</code> not explicitly <code>false</code>), <strong>agency SMTP</strong> is used.</li>
        <li>Otherwise <strong>system SMTP</strong> (from env) is used.</li>
      </ul>
      <p>Which emails pass <code>agencyId</code>?</p>
      <ul>
        <li><strong>Test email (this page):</strong> Yes → uses agency SMTP when configured.</li>
        <li><strong>Invitation (admin creates user with “Send invitation”):</strong> Yes → agency SMTP.</li>
        <li><strong>Admin “Send password reset” (tenant or superadmin):</strong> Yes when tenant → agency SMTP for tenant; superadmin send uses platform context.</li>
        <li><strong>Verification email (sign-up):</strong> No — <code>sendVerificationEmail</code> in <code>lib/mail.ts</code> passes <code>agencyId: undefined</code> → always system SMTP.</li>
        <li><strong>Forgot password (user-initiated):</strong> No — auth.service does not pass agencyId to <code>sendPasswordResetEmail</code> → always system SMTP.</li>
      </ul>
      <p>
        So the SMTP block on this page directly affects test email, invitation, and admin reset. Verification and forgot-password currently ignore agency SMTP and always use system (.env) SMTP.
      </p>

      <h2>Backend “smtpEnabled” vs UI</h2>
      <p>
        The sender resolver also checks <code>smtpEnabled</code> in agency settings: if <code>{`smtpEnabled === false`}</code>, agency SMTP is not used even if host is set. The dashboard Email form does <strong>not</strong> expose <code>smtpEnabled</code>. So:
      </p>
      <ul>
        <li>If the agency sets SMTP Host (and saves), the resolver treats that as “use agency SMTP” (because <code>smtpEnabled</code> is undefined, not false).</li>
        <li>To force “use system SMTP only” for an agency that has host set, you’d have to set <code>{`smtpEnabled: false`}</code> via API or DB; there is no toggle for it on this page.</li>
      </ul>

      <h2>Summary</h2>
      <ul>
        <li><strong>Page:</strong> Dashboard → Settings → Email. SMTP fields + test email.</li>
        <li><strong>Storage:</strong> SMTP in <code>Agency.settings</code> (and identity fields on <code>Agency</code>). Password never returned on GET.</li>
        <li><strong>Test email:</strong> Uses <code>agencyId</code> and thus agency SMTP when configured; otherwise system SMTP. Confirms that the SMTP block works for that agency.</li>
        <li><strong>Who uses agency SMTP:</strong> Test email, invitation, admin password reset (when agency context). Verification and forgot-password use system SMTP only.</li>
        <li><code>smtpEnabled</code> is not in the UI; “use agency SMTP” is effectively “SMTP host is set”.</li>
      </ul>
    </DocsLayout>
  );
}
