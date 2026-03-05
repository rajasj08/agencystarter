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
import { useMemo } from "react";
import { Logo } from "@/layout/Logo";
import { getVisibleMenuItems, getMenuIcon } from "@/core/navigation/menu.config";
import { useAuthStore, isSuperAdminUser } from "@/store/auth";

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);

  const visibleItems = useMemo(
    () => getVisibleMenuItems(permissions, isSuperAdminUser(user)),
    [permissions, user]
  );

  return (
    <SidebarPrimitive
      className="hidden h-screen shrink-0 md:flex"
      collapsed={collapsed}
    >
      <SidebarHeader className="shrink-0">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {visibleItems.map((item) => {
            const Icon = getMenuIcon(item.icon);
            const active = pathname === item.path;
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton asChild active={active} isCollapsed={collapsed}>
                  <Link
                    href={item.path}
                    aria-current={active ? "page" : undefined}
                    aria-label={item.label}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    <span>{item.label}</span>
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
