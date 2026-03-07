import { DocsLayout } from "@/components/docs/DocsLayout";

export default function AuthSsoPage() {
  return (
    <DocsLayout>
      <h1>Auth & SSO</h1>
      <p>
        The application supports email/password login and optional OpenID Connect
        (OIDC) single sign-on per agency. SSO is configured by the platform
        (superadmin); agency admins do not manage SSO settings.
      </p>

      <h2>Login entry points</h2>
      <ul>
        <li>
          <strong>Generic login</strong> — <code>/login</code>. Email and password
          only; no agency context.
        </li>
        <li>
          <strong>Agency login</strong> — <code>/agency/[slug]/login</code>.
          Agency-branded page with optional “Sign in with SSO” and/or
          email/password. Restricted to users belonging to that agency; superadmin
          and other agencies receive a generic invalid-credentials response.
        </li>
      </ul>

      <h2>SSO flow (OIDC)</h2>
      <p>
        When SSO is enabled for an agency, the frontend redirects to the backend
        initiate URL with <code>agencyId</code> and <code>return_url</code>. The
        backend uses a fixed callback URL (registered at the IdP), redirects the
        user to the IdP, and after sign-in the IdP redirects back to the backend.
        The backend exchanges the code for tokens, finds or creates the user, then
        redirects to the frontend <code>return_url</code> with access and refresh
        tokens in the URL hash.
      </p>

      <h2>Backend endpoints (when SSO enabled)</h2>
      <pre>
        <code>{`GET /api/v1/auth/sso/status?slug=...|agencyId=...
     → Returns ssoEnabled, ssoEnforced, provider, agencyId (no auth)

GET /api/v1/auth/sso/oidc?agencyId=...&return_url=...
     → Redirects to IdP (fixed backend callback; frontend never talks to IdP)

GET /api/v1/auth/sso/oidc/callback
     → IdP callback; exchange code, issue tokens, redirect to return_url#...`}</code>
      </pre>

      <h2>Frontend callback</h2>
      <p>
        The frontend callback page (<code>/login/callback</code>) reads tokens from
        the URL hash, clears the hash with <code>replaceState</code>, stores the
        tokens, fetches the current user, then redirects to dashboard or onboarding.
        It does not log or send the hash to analytics.
      </p>

      <h2>SSO setup &amp; providers</h2>
      <p>
        For a step-by-step guide on enabling SSO, configuring your agency, and
        getting the required details from Auth0, Okta, and other providers, see{" "}
        <a href="/auth-sso/sso">SSO setup &amp; providers</a>.
      </p>

      <h2>Further reading</h2>
      <p>
        See <code>docs/SSO-FRONTEND-INTEGRATION.md</code> and{" "}
        <code>backend/docs/sso.md</code> for detailed flow, security notes, and
        configuration.
      </p>
    </DocsLayout>
  );
}
