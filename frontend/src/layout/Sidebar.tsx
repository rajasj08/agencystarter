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
import { Logo } from "@/layout/Logo";
import { navigation, getNavIcon } from "@/layout/Navigation";
import { useAuthStore } from "@/store/auth";
import { ROLES } from "@/constants/permissions";

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const user = useAuthStore((s) => s.user);

  const visibleItems = navigation.filter((item) => {
    if (item.visible === false) return false;
    if (item.superAdminOnly) return user?.role === ROLES.SUPER_ADMIN;
    return true;
  });

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
            const Icon = getNavIcon(item.icon);
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
