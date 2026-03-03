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
  /** True when SUPER_ADMIN is acting in another agency's context. */
  impersonation?: boolean;
  /** Set when impersonation is true; the agency being impersonated. */
  impersonatingAgency?: { id: string; name: string } | null;
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
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface EmailVerificationRequiredResponse {
  user: AuthUser;
  message: string;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<ApiSuccess<LoginResponse>>("/auth/login", { email, password });
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

export async function refresh(refreshToken: string) {
  const { data } = await api.post<ApiSuccess<Omit<LoginResponse, "refreshToken">>>("/auth/refresh", {
    refreshToken,
  });
  return data.data;
}

export async function logout(refreshToken: string) {
  await api.post("/auth/logout", { refreshToken });
}

export async function getMe() {
  const { data } = await api.get<ApiSuccess<AuthUser>>("/auth/me");
  return data.data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<ApiSuccess<{ message: string }>>("/auth/forgot-password", { email });
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

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string
) {
  try {
    const { data } = await api.post<ApiSuccess<{ message: string }>>("/auth/change-password", {
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

export async function logoutOtherSessions(refreshToken: string): Promise<{ count: number }> {
  const { data } = await api.post<ApiSuccess<{ message: string; count: number }>>("/auth/sessions/logout-others", {
    refreshToken,
  });
  return { count: data.data.count };
}
