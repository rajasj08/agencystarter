import axios, { type AxiosInstance } from "axios";
import { refresh } from "./auth";
import { useAuthStore } from "@/store/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

let refreshing = false;

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const hadAuth = original?.headers?.Authorization;
    if (
      err.response?.status === 401 &&
      !original._retry &&
      typeof window !== "undefined" &&
      hadAuth
    ) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().getStoredRefreshToken();
      if (refreshToken && !refreshing) {
        refreshing = true;
        try {
          const data = await refresh(refreshToken);
          useAuthStore.getState().setAuth(
            data.user,
            data.accessToken,
            refreshToken,
            data.permissions,
            data.permissionVersion
          );
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          useAuthStore.getState().clearAuth();
          window.location.href = "/login";
        } finally {
          refreshing = false;
        }
      } else {
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export interface ApiSuccess<T> {
  success: true;
  code: string;
  message: string;
  data: T;
}

/** Standard pagination meta from list endpoints (page, limit, total, pages). */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiPaginated<T> {
  success: true;
  code: string;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  success: false;
  code: string;
  message: string;
  errors?: unknown[];
}

/** Build query string for paginated/sorted list APIs. */
export function buildListParams(params: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: string | number | undefined;
}): string {
  const search = new URLSearchParams();
  if (params.page != null) search.set("page", String(params.page));
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.sortBy != null) search.set("sortBy", params.sortBy);
  if (params.sortOrder != null) search.set("sortOrder", params.sortOrder);
  Object.entries(params).forEach(([k, v]) => {
    if (!["page", "limit", "sortBy", "sortOrder"].includes(k) && v !== undefined && v !== "") {
      search.set(k, String(v));
    }
  });
  const q = search.toString();
  return q ? `?${q}` : "";
}
