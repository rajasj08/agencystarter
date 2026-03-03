"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";

const APP_NAME = "Agency Starter";

/**
 * Single place for logo and app name. Future: tenant logo support.
 */
export function Logo() {
  return (
    <Link
      href={ROUTES.DASHBOARD}
      className="flex items-center gap-2 font-semibold text-lg text-sidebar-foreground hover:text-sidebar-foreground/90 focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2 rounded-md"
      aria-label={`${APP_NAME} home`}
    >
      {APP_NAME}
    </Link>
  );
}
