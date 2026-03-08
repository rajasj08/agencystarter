import { DocsLayout } from "@/components/docs/DocsLayout";

export default function EmailsPage() {
  return (
    <DocsLayout>
      <h1>Email sending</h1>
      <p>
        The application sends emails for authentication flows (verification, password reset,
        invitation) and for testing (SMTP test, template preview). All transactional emails
        use templates that can be overridden per agency or globally by superadmin. Link expiry
        is controlled by environment variables.
      </p>

      <h2>When emails are sent</h2>
      <p>Below are all the cases where an email is sent, the template used, and how expiry is applied.</p>

      <table className="w-full border-collapse border border-docs-border text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-docs-border px-3 py-2 text-left font-semibold">Trigger</th>
            <th className="border border-docs-border px-3 py-2 text-left font-semibold">Template</th>
            <th className="border border-docs-border px-3 py-2 text-left font-semibold">Expiry / Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-docs-border px-3 py-2">User registers and system setting “Require email verification” is on</td>
            <td className="border border-docs-border px-3 py-2"><code>verification</code></td>
            <td className="border border-docs-border px-3 py-2"><code>EMAIL_VERIFICATION_EXPIRY_HOURS</code> (default 24). Link in email verifies the user’s address.</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2">User requests “Forgot password” (public form)</td>
            <td className="border border-docs-border px-3 py-2"><code>password-reset</code></td>
            <td className="border border-docs-border px-3 py-2"><code>PASSWORD_RESET_EXPIRY_MINUTES</code> (default 60). Link allows setting a new password.</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2">Agency admin sends “Send password reset” from dashboard user edit</td>
            <td className="border border-docs-border px-3 py-2"><code>password-reset-admin</code></td>
            <td className="border border-docs-border px-3 py-2">Same as above. Different copy (“An administrator has sent you…”).</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2">Superadmin sends “Send password reset” from superadmin user edit</td>
            <td className="border border-docs-border px-3 py-2"><code>password-reset-admin</code></td>
            <td className="border border-docs-border px-3 py-2">Same as above (platform user, same template and expiry).</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2">Admin creates a user with “Send invitation” (user sets own password)</td>
            <td className="border border-docs-border px-3 py-2"><code>invitation</code></td>
            <td className="border border-docs-border px-3 py-2"><code>INVITATION_EXPIRY_DAYS</code> (default 7). Link goes to same reset-password flow; copy is “You’re invited…”.</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2">Agency sends “Test email” from Settings (e.g. Email / SMTP)</td>
            <td className="border border-docs-border px-3 py-2"><code>test</code></td>
            <td className="border border-docs-border px-3 py-2">No link expiry. Confirms SMTP delivery.</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2">Superadmin or agency sends “Send test email” from email template editor</td>
            <td className="border border-docs-border px-3 py-2">Selected template (<code>verification</code>, <code>password-reset</code>, etc.)</td>
            <td className="border border-docs-border px-3 py-2">Uses sample variables and app URL; links are placeholders, not valid tokens.</td>
          </tr>
        </tbody>
      </table>

      <h2>Templates and variables</h2>
      <p>
        Editable templates (files in <code>backend/templates/emails/</code>) and their template variables:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>verification</strong> — <code>appName</code>, <code>organizationName</code>, <code>userName</code>, <code>verificationLink</code></li>
        <li><strong>password-reset</strong> — <code>appName</code>, <code>organizationName</code>, <code>userName</code>, <code>resetLink</code>, <code>expiryMinutes</code></li>
        <li><strong>password-reset-admin</strong> — <code>appName</code>, <code>organizationName</code>, <code>userName</code>, <code>resetLink</code>, <code>expiryMinutes</code></li>
        <li><strong>invitation</strong> — <code>appName</code>, <code>organizationName</code>, <code>userName</code>, <code>setPasswordLink</code>, <code>expiryDisplay</code></li>
      </ul>
      <p>
        Overrides can be set per agency or at system level (superadmin). Resolution order: agency override → system override → filesystem HTML.
      </p>

      <h2>Environment variables for expiry</h2>
      <p>In <code>backend/.env</code> (see <code>.env.example</code> for optional keys):</p>
      <ul className="list-disc pl-6 space-y-1">
        <li><code>EMAIL_VERIFICATION_EXPIRY_HOURS</code> — Verification link validity (default <code>24</code>)</li>
        <li><code>PASSWORD_RESET_EXPIRY_MINUTES</code> — Password reset and admin reset link validity (default <code>60</code>)</li>
        <li><code>INVITATION_EXPIRY_DAYS</code> — Invitation “set password” link validity (default <code>7</code>)</li>
      </ul>
      <p>
        Tokens are stored in <code>EmailVerification</code> or <code>PasswordReset</code> with an <code>expiresAt</code> value. Links are single-use: after successful use the token is deleted.
      </p>

      <h2>API and UI entry points</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Verification</strong> — Sent by <code>POST /api/v1/auth/register</code> when verification is required.</li>
        <li><strong>Forgot password</strong> — <code>POST /api/v1/auth/forgot-password</code> (body: <code>email</code>).</li>
        <li><strong>Admin password reset (tenant)</strong> — <code>POST /api/v1/users/:id/send-password-reset</code> (agency-scoped, requires permission).</li>
        <li><strong>Admin password reset (platform)</strong> — <code>POST /api/v1/superadmin/users/:id/send-password-reset</code> (superadmin only).</li>
        <li><strong>Invitation</strong> — Sent when creating a user with “Send invitation” via <code>POST /api/v1/users</code> (tenant) or superadmin user create.</li>
        <li><strong>Test email (settings)</strong> — Settings API used by dashboard Settings → Email (or similar) “Send test email”.</li>
        <li><strong>Test email (template)</strong> — Email template API used by Superadmin or agency email template editor “Send test email”.</li>
      </ul>
    </DocsLayout>
  );
}
