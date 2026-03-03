# Agency Starter

Production-grade multi-tenant SaaS starter kit.

- **Backend:** Express, TypeScript, Prisma, PostgreSQL, JWT, RBAC
- **Frontend:** Next.js (App Router), TypeScript, Tailwind, theme system
- **Multi-tenancy:** Tenant = Agency (JWT, API, DB)

## Structure

- `backend/` – Express API, Prisma, auth, agencies, RBAC
- `frontend/` – Next.js app, theme, layouts, auth & onboarding
- `shared/` – Shared types/constants (optional)
- `docs/` – Documentation

## Quick start (run both)

For a full step-by-step (clone, env, DB, seed, run), see **[docs/quick-start.md](docs/quick-start.md)**.

From the project root:

```bash
npm install
# Set backend/.env (DATABASE_URL, JWT_SECRET) and run: cd backend && npm run db:push
# Set frontend/.env.local: NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm run dev              # runs backend ( :4000 ) and frontend ( :3000 ) concurrently
```

## Backend only

```bash
cd backend
cp .env.example .env   # Set DATABASE_URL, JWT_SECRET
npm install
npm run db:push        # Create DB schema
npm run dev            # http://localhost:4000
```

## Frontend only

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1" > .env.local
npm install
npm run dev            # http://localhost:3000
```

## Build order (from scope)

1. Backend core ✅  
2. Auth ✅  
3. Multi-tenancy ✅  
4. RBAC ✅  
5. Frontend UI system ✅  
6. Onboarding ✅  

## Email (backend)

All transactional email is sent from the backend using **nodemailer**. Templates live in `backend/templates/emails/` (HTML with `{{variable}}` placeholders).

- **Verification:** `verification.html` – sent when `REQUIRE_EMAIL_VERIFICATION=true`
- **Password reset:** `password-reset.html` – sent from forgot-password flow

Configure SMTP in `backend/.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). If `SMTP_HOST` is unset, emails are not sent; in development the verification/reset links are logged to the console.

Optional: `APP_NAME` (used in subject and footer; default: "Agency Starter").

## API

- `POST /api/v1/auth/register` – Register
- `POST /api/v1/auth/login` – Login
- `GET /api/v1/auth/me` – Current user (Bearer token)
- `POST /api/v1/agencies` – Create agency (auth, onboarding)
- `GET /api/v1/agencies` – List agencies
- `GET /api/v1/agencies/:id` – Get agency
