/**
 * Vitest globalSetup: prepare isolated test database.
 * Runs in a separate process. Set DATABASE_URL_TEST (and optionally RUN_TEST_DB_SETUP=1).
 *
 * When RUN_TEST_DB_SETUP=1:
 * - Uses DATABASE_URL_TEST (or DATABASE_URL) and runs prisma migrate deploy + db seed.
 * This gives a clean, known state before invariant tests run.
 *
 * In CI, use an ephemeral DB URL and RUN_TEST_DB_SETUP=1.
 */

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function globalSetup(): Promise<void> {
  const url = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
  if (!url) return;

  if (process.env.RUN_TEST_DB_SETUP !== "1" && process.env.RUN_TEST_DB_SETUP !== "true") return;

  process.env.DATABASE_URL = url;
  const root = path.resolve(__dirname, "..");

  execSync("npx prisma migrate deploy", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
  execSync("npx prisma db seed", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
