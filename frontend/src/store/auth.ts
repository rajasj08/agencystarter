import { create } from "zustand";
import type { AuthUser } from "@/services/auth";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const USER_KEY = "user";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** True after hydrate() has run (so we can tell "no token" from "not loaded yet"). */
  hydrated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
  hydrate: () => void;
  getStoredRefreshToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,
  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ACCESS_KEY, accessToken);
      localStorage.setItem(REFRESH_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      document.cookie = "auth_session=1; path=/; max-age=900";
    }
    set({ user, accessToken, refreshToken });
  },
  setUser: (user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user });
  },
  setTokens: (accessToken, refreshToken) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ACCESS_KEY, accessToken);
      if (refreshToken != null) localStorage.setItem(REFRESH_KEY, refreshToken);
    }
    set((s) => ({ ...s, accessToken, ...(refreshToken != null ? { refreshToken } : {}) }));
  },
  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      document.cookie = "auth_session=; path=/; max-age=0";
    }
    set({ user: null, accessToken: null, refreshToken: null });
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    const accessToken = localStorage.getItem(ACCESS_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (accessToken && userStr) {
      try {
        document.cookie = "auth_session=1; path=/; max-age=900";
        set({ accessToken, refreshToken, user: JSON.parse(userStr) as AuthUser, hydrated: true });
      } catch {
        get().clearAuth();
        set({ hydrated: true });
      }
    } else {
      set({ hydrated: true });
    }
  },
  getStoredRefreshToken: () => (typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null),
}));
