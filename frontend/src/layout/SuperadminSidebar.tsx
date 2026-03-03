"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Building2, Users, Settings, FileText, BadgeDollarSign } from "lucide-react";
import { ROUTES } from "@/constants/routes";

const navItems = [
  { title: "Overview", href: ROUTES.SUPERADMIN, icon: LayoutDashboard },
  { title: "Agencies", href: ROUTES.SUPERADMIN_AGENCIES, icon: Building2 },
  { title: "Users", href: ROUTES.SUPERADMIN_USERS, icon: Users },
  { title: "Plans", href: ROUTES.SUPERADMIN_PLANS, icon: BadgeDollarSign },
  { title: "System Settings", href: ROUTES.SUPERADMIN_SYSTEM_SETTINGS, icon: Settings },
  { title: "Audit Logs", href: ROUTES.SUPERADMIN_AUDIT, icon: FileText },
];

export function SuperadminSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <SidebarPrimitive className="hidden h-screen shrink-0 border-r border-border md:flex" collapsed={collapsed}>
      <SidebarHeader className="shrink-0 border-b border-border px-4 py-3">
        <span className="font-semibold text-primary">Super Admin</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild active={active} isCollapsed={collapsed}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    aria-label={item.title}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </SidebarPrimitive>
  );
}
