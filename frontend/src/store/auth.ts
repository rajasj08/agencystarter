import { create } from "zustand";
import type { AuthUser } from "@/services/auth";
import { EXPECTED_PERMISSION_VERSION } from "@/constants/permissionVersion";

const ACCESS_KEY = "accessToken";
const USER_KEY = "user";
const PERMISSIONS_KEY = "permissions";
const PERMISSION_VERSION_KEY = "permissionVersion";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  /** From backend only; do not derive. */
  permissions: string[];
  /** Plan/feature capabilities (e.g. from subscription). Optional until wired. */
  userCapabilities: string[];
  permissionVersion: number | null;
  hydrated: boolean;
  setAuth: (
    user: AuthUser,
    accessToken: string,
    permissions: string[],
    permissionVersion: number
  ) => void;
  /** Update user + permissions from /me (e.g. after getMe). */
  setAuthFromMe: (user: AuthUser, permissions: string[], permissionVersion: number) => void;
  setUser: (user: AuthUser) => void;
  setTokens: (accessToken: string) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

/** Use backend isSuperAdmin; no role-name checks. */
export function isSuperAdminUser(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.isSuperAdmin === true && !user.impersonation;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  permissions: [],
  userCapabilities: [],
  permissionVersion: null,
  hydrated: false,
  setAuth: (user, accessToken, permissions, permissionVersion) => {
    if (permissionVersion !== EXPECTED_PERMISSION_VERSION && typeof window !== "undefined") {
      console.warn("[auth] Permission version mismatch; clearing session.");
      get().clearAuth();
      set({ hydrated: true });
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(ACCESS_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
      localStorage.setItem(PERMISSION_VERSION_KEY, String(permissionVersion));
      document.cookie = "auth_session=1; path=/; max-age=900";
    }
    set({ user, accessToken, permissions, userCapabilities: [], permissionVersion, hydrated: true });
  },
  setAuthFromMe: (user, permissions, permissionVersion) => {
    if (permissionVersion !== EXPECTED_PERMISSION_VERSION && typeof window !== "undefined") {
      console.warn("[auth] Permission version mismatch; clearing session.");
      get().clearAuth();
      set({ hydrated: true });
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
      localStorage.setItem(PERMISSION_VERSION_KEY, String(permissionVersion));
    }
    set((s) => ({ ...s, user, permissions, permissionVersion }));
  },
  setUser: (user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user });
  },
  setTokens: (accessToken) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ACCESS_KEY, accessToken);
    }
    set((s) => ({ ...s, accessToken }));
  },
  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(PERMISSIONS_KEY);
      localStorage.removeItem(PERMISSION_VERSION_KEY);
      document.cookie = "auth_session=; path=/; max-age=0";
    }
    set({
      user: null,
      accessToken: null,
      permissions: [],
      userCapabilities: [],
      permissionVersion: null,
    });
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    const accessToken = localStorage.getItem(ACCESS_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    const permissionsStr = localStorage.getItem(PERMISSIONS_KEY);
    const versionStr = localStorage.getItem(PERMISSION_VERSION_KEY);
    const permissionVersion = versionStr != null ? parseInt(versionStr, 10) : null;
    if (accessToken && userStr) {
      try {
        const user = JSON.parse(userStr) as AuthUser;
        const permissions: string[] =
          permissionsStr != null ? JSON.parse(permissionsStr) : [];
        if (permissionVersion !== EXPECTED_PERMISSION_VERSION || Number.isNaN(permissionVersion)) {
          console.warn("[auth] Permission version mismatch on hydrate; clearing session.");
          get().clearAuth();
          set({ hydrated: true });
          return;
        }
        document.cookie = "auth_session=1; path=/; max-age=900";
        set({
          accessToken,
          user,
          permissions,
          userCapabilities: [],
          permissionVersion,
          hydrated: true,
        });
      } catch {
        get().clearAuth();
        set({ hydrated: true });
      }
    } else {
      set({ hydrated: true });
    }
  },
}));
