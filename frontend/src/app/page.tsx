import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { AppButton } from "@/components/design";
import { APP_CONFIG } from "@/config/app";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-md">
      <h1 className="text-3xl font-bold text-text-primary">{APP_CONFIG.appName}</h1>
      <p className="text-text-secondary text-center max-w-md">
        Production-grade multi-tenant SaaS. Next.js, Express, Prisma, PostgreSQL.
      </p>
      <div className="flex gap-4">
        <Link href={ROUTES.LOGIN}>
          <AppButton>Login</AppButton>
        </Link>
        <Link href={ROUTES.REGISTER}>
          <AppButton variant="secondary">Register</AppButton>
        </Link>
      </div>
    </div>
  );
}
