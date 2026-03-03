/**
 * Layout dimensions. Sidebar, header, content max width.
 * Tighter content width to avoid excess empty space on the right.
 */
export const layout = {
  sidebarWidth: 260,
  sidebarWidthCollapsed: 64,
  headerHeight: 56,
  contentMaxWidth: 1100,
} as const;

export type Layout = typeof layout;
