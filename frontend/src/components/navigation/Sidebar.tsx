"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";

const navItems = [
  { href: ROUTES.DASHBOARD, label: "Dashboard" },
  { href: ROUTES.USERS, label: "Users" },
  { href: ROUTES.SETTINGS, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-sidebar min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-md border-b border-border">
        <Link href={ROUTES.DASHBOARD} className="font-semibold text-lg text-text-primary">
          Agency Starter
        </Link>
      </div>
      <nav className="p-md flex flex-col gap-1">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
              pathname === href
                ? "bg-primary/10 text-primary"
                : "text-text-secondary hover:bg-black/5 hover:text-text-primary"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
