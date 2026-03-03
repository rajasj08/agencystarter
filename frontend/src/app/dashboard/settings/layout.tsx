"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "General", href: ROUTES.SETTINGS_GENERAL },
  { label: "User Management", href: ROUTES.SETTINGS_USERS },
  { label: "Email", href: ROUTES.SETTINGS_EMAIL },
  { label: "Security", href: ROUTES.SETTINGS_SECURITY },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      <nav className="mb-6 flex gap-2 border-b border-border" aria-label="Settings sections">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              pathname === tab.href
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
