import { DocsLayout } from "@/components/docs/DocsLayout";

export default function SsoSetupPage() {
  return (
    <DocsLayout>
      <h1>SSO setup &amp; providers</h1>
      <p>
        This guide explains how single sign-on (SSO) works in Agency Starter, how to
        turn it on, and how to get the right settings from Auth0, Okta, and other
        OpenID Connect (OIDC) providers.
      </p>

      <h2>How SSO works</h2>
      <p>
        The app uses <strong>OpenID Connect (OIDC)</strong> so users can sign in
        with your identity provider (IdP) instead of a password. The flow is:
      </p>
      <ol>
        <li>
          User opens the <strong>agency login page</strong> (e.g.{" "}
          <code>/agency/acme/login</code>) and clicks &ldquo;Sign in with SSO&rdquo;.
        </li>
        <li>
          The <strong>frontend</strong> sends the user to your backend with the
          agency id and where to return after login. The frontend never talks to
          the IdP.
        </li>
        <li>
          The <strong>backend</strong> redirects the user to your IdP (Auth0,
          Okta, etc.). The user signs in there.
        </li>
        <li>
          The <strong>IdP</strong> redirects back to a fixed URL on your backend
          (the &ldquo;callback URL&rdquo;) with a one-time code.
        </li>
        <li>
          The <strong>backend</strong> exchanges that code for tokens, finds or
          creates the user in the agency, and issues its own access and refresh
          tokens.
        </li>
        <li>
          The user is sent back to your <strong>frontend</strong> with those
          tokens in the URL (in the hash). The frontend stores them and the user
          is logged in.
        </li>
      </ol>
      <p>
        So: <strong>only the backend talks to the IdP</strong>. You register one
        callback URL at the IdP (the backend URL). The frontend only needs to
        know your API base URL and the agency context.
      </p>

      <h2>What you need to configure</h2>
      <p>Two levels of configuration:</p>
      <ul>
        <li>
          <strong>Backend (once)</strong> — Enable SSO and set the public URL of
          your API so the backend can build the callback URL.
        </li>
        <li>
          <strong>Per agency</strong> — For each agency that uses SSO, you set the
          IdP details (issuer, client ID, client secret, and optional options).
          Only the platform (superadmin) can do this; agency admins cannot.
        </li>
      </ul>

      <h2>Localhost vs production: what URL to use</h2>
      <p>
        The backend needs to know its <strong>public URL</strong> so it can tell the IdP where to redirect after login. Use different values for local development and production.
      </p>
      <table className="w-full border-collapse border border-docs-border text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-docs-border px-3 py-2 text-left font-semibold">When</th>
            <th className="border border-docs-border px-3 py-2 text-left font-semibold">API_PUBLIC_BASE_URL</th>
            <th className="border border-docs-border px-3 py-2 text-left font-semibold">Callback URL to register at IdP</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-docs-border px-3 py-2 font-medium">Local testing</td>
            <td className="border border-docs-border px-3 py-2"><code>http://localhost:4000</code></td>
            <td className="border border-docs-border px-3 py-2"><code>http://localhost:4000/api/v1/auth/sso/oidc/callback</code></td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2 font-medium">Production</td>
            <td className="border border-docs-border px-3 py-2"><code>https://api.yourcompany.com</code></td>
            <td className="border border-docs-border px-3 py-2"><code>https://api.yourcompany.com/api/v1/auth/sso/oidc/callback</code></td>
          </tr>
        </tbody>
      </table>
      <p>
        Use the port your backend actually runs on (default is 4000). In the IdP (Auth0, Okta, etc.) you add the <strong>Callback URL</strong> from the table as an allowed redirect URI. For localhost testing, add the <code>http://localhost:4000/...</code> URL; for production, add the <code>https://...</code> URL. Many providers let you add both so one app works for dev and prod.
      </p>

      <h2>Backend configuration</h2>
      <p>In your backend environment (e.g. <code>backend/.env</code>):</p>
      <pre>
        <code>{`# Required to enable SSO routes (otherwise /auth/sso/* returns 404)
AUTH_SSO_ENABLED=true

# Public URL of your API (no trailing slash). See table above for localhost vs production.
API_PUBLIC_BASE_URL=http://localhost:4000

# Frontend origin(s). Must include where your app runs so the backend can redirect there after SSO.
# Local: http://localhost:3000   Production: https://app.yourcompany.com
CORS_ORIGIN=http://localhost:3000

# Optional: allow creating a user on first SSO sign-in if no user exists for that email in the agency
AUTH_SSO_AUTO_PROVISION=false`}</code>
      </pre>
      <p>
        For <strong>localhost testing</strong>: set <code>API_PUBLIC_BASE_URL=http://localhost:4000</code> and <code>CORS_ORIGIN=http://localhost:3000</code> (or the port your frontend uses). Then in your IdP, add <code>http://localhost:4000/api/v1/auth/sso/oidc/callback</code> as an allowed callback URL.
      </p>
      <p>
        The <strong>callback URL</strong> the backend uses is always: <code>{`{API_PUBLIC_BASE_URL}/api/v1/auth/sso/oidc/callback`}</code>.
      </p>

      <h2>Per-agency configuration (Superadmin)</h2>
      <p>
        In the app, go to <strong>Superadmin → Agencies → [agency] → Edit</strong>.
        In the &ldquo;SSO (optional)&rdquo; section:
      </p>
      <ul>
        <li>Enable SSO</li>
        <li>Optionally check &ldquo;Enforce SSO&rdquo; so password login is hidden for that agency</li>
        <li>Provider: OIDC (only option today)</li>
        <li>
          <strong>Issuer URL</strong> — From your IdP (see provider sections below)
        </li>
        <li>
          <strong>Client ID</strong> — From your IdP application
        </li>
        <li>
          <strong>Client secret</strong> — From your IdP application (leave blank to keep existing when editing)
        </li>
        <li>
          <strong>Scope</strong> — Usually <code>openid email profile</code> (default)
        </li>
        <li>
          <strong>Allowed email domains</strong> — Optional; e.g. <code>company.com</code> to restrict sign-in to that domain
        </li>
      </ul>
      <p>
        The backend never returns the client secret in API responses; it is only
        used when talking to the IdP.
      </p>

      <h2>Details you need from the IdP</h2>
      <p>Every OIDC provider gives you the same kind of values. You need:</p>
      <table className="w-full border-collapse border border-docs-border text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-docs-border px-3 py-2 text-left font-semibold">Setting</th>
            <th className="border border-docs-border px-3 py-2 text-left font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-docs-border px-3 py-2 font-medium">Issuer URL</td>
            <td className="border border-docs-border px-3 py-2">The IdP’s OpenID discovery URL (e.g. <code>https://your-tenant.auth0.com/</code>). No path needed; the app will use <code>/.well-known/openid-configuration</code>.</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2 font-medium">Client ID</td>
            <td className="border border-docs-border px-3 py-2">The application’s public identifier from the IdP.</td>
          </tr>
          <tr>
            <td className="border border-docs-border px-3 py-2 font-medium">Client secret</td>
            <td className="border border-docs-border px-3 py-2">The application’s secret; used by the backend to exchange the authorization code for tokens.</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-4">
        You also need to <strong>register the callback URL</strong> in the IdP as
        an allowed redirect/callback URI. Use the backend callback URL from above.
      </p>

      <h2>Auth0</h2>
      <p>Steps to get the values and configure Auth0:</p>
      <ol>
        <li>Log in to the <a href="https://manage.auth0.com" target="_blank" rel="noopener noreferrer">Auth0 Dashboard</a>.</li>
        <li>
          Go to <strong>Applications → Applications</strong> and create an application (or use an existing one). Choose <strong>Regular Web Application</strong>.
        </li>
        <li>
          In the application settings:
          <ul>
            <li>
              <strong>Allowed Callback URLs</strong> — Add your backend callback URL(s). For local testing add <code>http://localhost:4000/api/v1/auth/sso/oidc/callback</code>; for production add <code>https://api.yourcompany.com/api/v1/auth/sso/oidc/callback</code> (or your real API domain). You can add both.
            </li>
            <li>
              <strong>Allowed Logout URLs</strong> — Optional; add your frontend login URL if you use logout (e.g. <code>http://localhost:3000</code> for local, <code>https://app.yourcompany.com</code> for production).
            </li>
          </ul>
        </li>
        <li>
          Open the <strong>Settings</strong> tab. You will see:
          <ul>
            <li><strong>Domain</strong> — Your issuer is <code>https://YOUR_DOMAIN/</code> (e.g. <code>https://tenant.us.auth0.com/</code>)</li>
            <li><strong>Client ID</strong> — Copy this into the agency SSO form</li>
            <li><strong>Client Secret</strong> — Copy this into the agency SSO form (show it first if hidden)</li>
          </ul>
        </li>
        <li>
          In the agency SSO form, set <strong>Issuer URL</strong> to <code>https://YOUR_AUTH0_DOMAIN/</code> (your Domain from Auth0, with <code>https://</code> and a trailing <code>/</code>).
        </li>
      </ol>
      <p>
        Auth0 will return <code>openid</code>, <code>email</code>, and <code>profile</code> by default. Use scope <code>openid email profile</code> in the agency config unless you need more.
      </p>
      <h3>Auth0: &ldquo;authorize/resume&rdquo; or &ldquo;misconfiguration&rdquo; error</h3>
      <p>
        If you see an Auth0 page at <code>/authorize/resume</code> saying there could be a misconfiguration, check the following in your Auth0 application:
      </p>
      <ul>
        <li>
          <strong>Application Type</strong> — Must be <strong>Regular Web Application</strong> (not Single Page Application).
        </li>
        <li>
          <strong>Allowed Callback URLs</strong> — Must contain the <strong>exact</strong> backend callback URL with no trailing slash: <code>http://localhost:4000/api/v1/auth/sso/oidc/callback</code>. If your backend runs on a different port or domain, use that exact URL. Add one line per URL; you can add both localhost and production.
        </li>
        <li>
          <strong>Allowed Web Origins</strong> — Add <code>http://localhost:4000</code> and <code>http://localhost:3000</code> (and your production API/frontend origins when you deploy). This avoids Auth0 blocking the redirect flow.
        </li>
        <li>
          <strong>Advanced Settings → OAuth</strong> — Token Endpoint Authentication Method: <strong>Post</strong>. Grant Types: ensure <strong>Authorization Code</strong> is enabled. No custom response mode that would override query.
        </li>
      </ul>
      <p>
        After changing settings, save the application and try signing in with SSO again.
      </p>

      <h2>Okta</h2>
      <p>Steps for Okta:</p>
      <ol>
        <li>Log in to your <a href="https://developer.okta.com" target="_blank" rel="noopener noreferrer">Okta Admin</a> or Okta Developer console.</li>
        <li>
          Go to <strong>Applications → Applications</strong> and <strong>Create App Integration</strong>. Choose <strong>OIDC</strong> and <strong>Web Application</strong>.
        </li>
        <li>
          Configure:
          <ul>
            <li><strong>Sign-in redirect URIs</strong> — Add your backend callback URL. For local testing use <code>http://localhost:4000/api/v1/auth/sso/oidc/callback</code>; for production use <code>https://api.yourcompany.com/api/v1/auth/sso/oidc/callback</code>. You can add both.</li>
            <li><strong>Sign-out redirect URIs</strong> — Optional</li>
            <li>Assign users or groups as needed</li>
          </ul>
        </li>
        <li>
          After creation, open the app. In the <strong>General</strong> tab you’ll see:
          <ul>
            <li><strong>Client ID</strong> — Use this in the agency SSO form</li>
            <li><strong>Client secret</strong> — Reveal and copy into the agency SSO form</li>
          </ul>
        </li>
        <li>
          <strong>Issuer URL</strong> — In Okta it’s your authorization server. Go to <strong>Security → API</strong> and open the default authorization server (or the one you use). The <strong>Issuer URI</strong> is shown there (e.g. <code>https://dev-12345.okta.com/oauth2/default</code>). Use that exact value as the Issuer URL in the agency SSO form.
        </li>
      </ol>
      <p>
        Okta supports the standard <code>openid email profile</code> scope. Use that unless you need custom claims.
      </p>

      <h2>Other OIDC providers (Google, Azure AD, Keycloak, etc.)</h2>
      <p>The same idea applies to any OpenID Connect–compatible provider:</p>
      <ol>
        <li>
          Create an <strong>OAuth 2.0 / OIDC application</strong> (or “Web app” / “Confidential client”) in the provider’s console.
        </li>
        <li>
          Set the <strong>redirect URI</strong> (or “callback URL”) to your backend callback: <code>{`{API_PUBLIC_BASE_URL}/api/v1/auth/sso/oidc/callback`}</code>.
        </li>
        <li>
          Get the <strong>issuer URL</strong> (often in “OpenID Connect” or “Discovery” docs). It might look like <code>https://accounts.google.com</code> or <code>https://login.microsoftonline.com/TENANT_ID/v2.0</code> or your Keycloak realm URL. Use the base URL the provider uses for <code>/.well-known/openid-configuration</code>.
        </li>
        <li>
          Copy the <strong>client ID</strong> and <strong>client secret</strong> into the agency SSO form.
        </li>
        <li>
          Ensure the provider is configured to return <strong>email</strong> and that email is verified (our backend requires <code>email_verified</code>). Scopes like <code>openid email profile</code> are usually enough.
        </li>
      </ol>
      <p>
        If the provider’s docs mention “Authorization Code” flow and “OpenID Connect”, you’re in the right place. Our backend uses the standard authorization code flow.
      </p>

      <h2>Quick reference</h2>
      <ul>
        <li><strong>Backend callback URL to register at the IdP:</strong> <code>{`{API_PUBLIC_BASE_URL}/api/v1/auth/sso/oidc/callback`}</code></li>
        <li><strong>Where to configure per agency:</strong> Superadmin → Agencies → [agency] → Edit → SSO section</li>
        <li><strong>Required per agency:</strong> Issuer URL, Client ID, Client secret (when first enabling)</li>
        <li><strong>Optional:</strong> Scope (default <code>openid email profile</code>), Allowed email domains</li>
      </ul>
      <h3>Quick localhost test checklist</h3>
      <ul>
        <li>Backend <code>.env</code>: <code>AUTH_SSO_ENABLED=true</code>, <code>API_PUBLIC_BASE_URL=http://localhost:4000</code>, <code>CORS_ORIGIN=http://localhost:3000</code></li>
        <li>In Auth0/Okta: add <code>http://localhost:4000/api/v1/auth/sso/oidc/callback</code> to allowed callback/redirect URIs</li>
        <li>In Superadmin: enable SSO for an agency and set Issuer URL, Client ID, Client secret from the IdP</li>
        <li>Open <code>http://localhost:3000/agency/your-agency-slug/login</code> and click &ldquo;Sign in with SSO&rdquo;</li>
      </ul>
      <h3>Troubleshooting: &ldquo;Missing code or state&rdquo;</h3>
      <p>
        If after IdP login you are sent back to the app with this error, the IdP is likely returning the authorization response in the <strong>URL fragment (hash)</strong> instead of the <strong>query string</strong>. The fragment is never sent to the server, so the backend never receives <code>code</code> or <code>state</code>.
      </p>
      <ul>
        <li><strong>Auth0:</strong> In the application, set <strong>Application Type</strong> to <strong>Regular Web Application</strong> (not &ldquo;Single Page Application&rdquo;). Ensure there is no &ldquo;Response Mode: fragment&rdquo; override.</li>
        <li><strong>Okta:</strong> Create the app as <strong>Web Application</strong> (not SPA). The default authorization code flow uses query parameters.</li>
        <li>In general: the IdP must redirect the browser to your callback URL with <code>?code=...&amp;state=...</code> in the URL (query), not <code>#code=...&amp;state=...</code> (fragment).</li>
      </ul>
    </DocsLayout>
  );
}
