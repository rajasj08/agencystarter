import { api, type ApiSuccess } from "./api";

export interface UserPreferences {
  language?: string | null;
  timezone?: string | null;
  emailNotifications?: boolean;
  securityAlerts?: boolean;
  marketingEmails?: boolean;
  systemNotifications?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  preferences?: UserPreferences;
  role: string;
  status: string;
  agencyId: string | null;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  agency: {
    id: string;
    name: string;
    slug: string;
    onboardingCompleted: boolean;
  } | null;
  /** True when user has platform superadmin role (backend source of truth). No UI role-name checks. */
  isSuperAdmin?: boolean;
  /** True when SUPER_ADMIN is acting in another agency's context. */
  impersonation?: boolean;
  /** Set when impersonation is true; the agency being impersonated. */
  impersonatingAgency?: { id: string; name: string } | null;
  /** True when user must change password on next login (e.g. after admin-generated temporary password). */
  forcePasswordChange?: boolean;
}

export interface SessionInfo {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  user: AuthUser;
  /** From backend; do not derive on frontend. */
  permissions: string[];
  permissionVersion: number;
}

export interface MeResponse {
  user: AuthUser;
  permissions: string[];
  permissionVersion: number;
}

export interface EmailVerificationRequiredResponse {
  user: AuthUser;
  message: string;
}

export interface SsoStatusResponse {
  ssoEnabled: boolean;
  agencyId?: string;
  provider?: string;
  ssoEnforced?: boolean;
}

/** SSO status for an agency (by slug or agencyId). Returns null on 404 (SSO off or agency not found). */
export async function getSsoStatus(params: { slug?: string; agencyId?: string }): Promise<SsoStatusResponse | null> {
  const slug = params.slug?.trim();
  const agencyId = params.agencyId?.trim();
  const query = slug ? `slug=${encodeURIComponent(slug)}` : agencyId ? `agencyId=${encodeURIComponent(agencyId)}` : "";
  if (!query) return null;
  try {
    const { data } = await api.get<ApiSuccess<SsoStatusResponse>>(`/auth/sso/status?${query}`);
    return data.data;
  } catch {
    return null;
  }
}

export async function login(
  email: string,
  password: string,
  options?: { agencySlug?: string }
) {
  const body: { email: string; password: string; agencySlug?: string } = { email, password };
  if (options?.agencySlug?.trim()) body.agencySlug = options.agencySlug.trim().toLowerCase();
  const { data } = await api.post<ApiSuccess<LoginResponse>>("/auth/login", body);
  return data.data;
}

export async function register(
  email: string,
  password: string,
  confirmPassword: string,
  name?: string
) {
  const { data } = await api.post<ApiSuccess<LoginResponse | EmailVerificationRequiredResponse>>("/auth/register", {
    email,
    password,
    confirmPassword,
    name,
  });
  return data.data;
}

export async function refresh() {
  const { data } = await api.post<ApiSuccess<Omit<LoginResponse, "refreshToken">>>("/auth/refresh", {});
  return data.data;
}

export async function logout() {
  await api.post("/auth/logout", {});
}

export async function getMe() {
  const { data } = await api.get<ApiSuccess<MeResponse>>("/auth/me");
  return data.data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<ApiSuccess<{ message: string }>>("/auth/forgot-password", { email });
  return data.data;
}

export async function validateResetToken(token: string): Promise<{ valid: boolean }> {
  const { data } = await api.post<ApiSuccess<{ valid: boolean }>>("/auth/validate-reset-token", { token });
  return data.data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post<ApiSuccess<{ message: string }>>("/auth/reset-password", { token, password });
  return data.data;
}

export async function verifyEmail(token: string) {
  const { data } = await api.post<ApiSuccess<{ message: string }>>("/auth/verify-email", { token });
  return data.data;
}

export interface ChangePasswordResponse {
  message: string;
  user: AuthUser | null;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string
): Promise<ChangePasswordResponse> {
  try {
    const { data } = await api.post<ApiSuccess<ChangePasswordResponse>>("/auth/change-password", {
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    return data.data;
  } catch (err: unknown) {
    const message =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      (err as Error)?.message ??
      "Failed to change password";
    throw new Error(message);
  }
}

export interface UpdateProfilePayload {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  preferences?: UserPreferences | null;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  try {
    const { data } = await api.patch<ApiSuccess<AuthUser>>("/auth/me", payload);
    if (!data?.data) throw new Error("Invalid response from server");
    return data.data;
  } catch (err: unknown) {
    const message =
      (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ??
      (err as Error)?.message ??
      "Failed to update profile";
    throw new Error(message);
  }
}

export async function getSessions(): Promise<SessionInfo[]> {
  const { data } = await api.get<ApiSuccess<{ sessions: SessionInfo[] }>>("/auth/sessions");
  return Array.isArray(data?.data?.sessions) ? data.data.sessions : [];
}

export async function logoutOtherSessions(): Promise<{ count: number }> {
  const { data } = await api.post<ApiSuccess<{ message: string; count: number }>>("/auth/sessions/logout-others", {});
  return { count: data.data.count };
}
