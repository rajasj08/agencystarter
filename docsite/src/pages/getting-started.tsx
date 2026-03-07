import { DocsLayout } from "@/components/docs/DocsLayout";

export default function GettingStartedPage() {
  return (
    <DocsLayout>
      <h1>Getting Started</h1>
      <p>
        Get the application running locally. You’ll need Node.js, a PostgreSQL
        database, and the repo cloned.
      </p>

      <h2>Prerequisites</h2>
      <ul>
        <li>Node.js 18 or later</li>
        <li>PostgreSQL 14 or later</li>
        <li>npm or pnpm</li>
      </ul>

      <h2>Clone and install</h2>
      <p>Clone the repository and install dependencies for backend and frontend.</p>
      <pre>
        <code>{`git clone <your-repo-url>
cd agencystarter

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install`}</code>
      </pre>

      <h2>Environment</h2>
      <p>
        Copy <code>backend/.env.example</code> to <code>backend/.env</code> and set
        at least <code>DATABASE_URL</code> and <code>JWT_SECRET</code>. The frontend
        uses <code>NEXT_PUBLIC_API_URL</code> (default <code>http://localhost:4000/api/v1</code>).
      </p>
      <pre>
        <code>{`# backend/.env (minimal for local)
DATABASE_URL=postgresql://user:pass@localhost:5432/agencystarter
JWT_SECRET=your-secret-min-32-chars
CORS_ORIGIN=http://localhost:3000`}</code>
      </pre>

      <h2>Database</h2>
      <p>Run migrations and optionally seed.</p>
      <pre>
        <code>{`cd backend
npx prisma migrate deploy
# Optional: npx prisma db seed`}</code>
      </pre>

      <h2>Run the app</h2>
      <p>From the project root, start backend and frontend together.</p>
      <pre>
        <code>{`# From repo root
npm run dev`}</code>
      </pre>
      <p>
        This runs the backend (default port 4000) and frontend (default 3000). Open{" "}
        <code>http://localhost:3000</code>. To run only backend or frontend, use{" "}
        <code>npm run dev:backend</code> or <code>npm run dev:frontend</code>.
      </p>
    </DocsLayout>
  );
}
