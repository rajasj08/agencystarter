import { api, type ApiSuccess, type PaginationMeta } from "./api";

export interface SystemSettingsDTO {
  allowRegistration: boolean;
  emailVerificationRequired: boolean;
  maintenanceMessage: string | null;
  defaultTheme: string;
  allowAgencyRegistration: boolean;
  maxUsersPerAgency: number | null;
  defaultTimezone: string;
  maintenanceMode: boolean;
}

export interface SystemSettingsUpdateInput {
  allowRegistration?: boolean;
  emailVerificationRequired?: boolean;
  maintenanceMessage?: string | null;
  defaultTheme?: string;
  allowAgencyRegistration?: boolean;
  maxUsersPerAgency?: number | null;
  defaultTimezone?: string;
  maintenanceMode?: boolean;
}

// Plans ----------------------------------------------------------------------

/** Plan features JSON, e.g. { reports: true, auditLogs: true } */
export type PlanFeatures = Record<string, boolean>;

/** Editor info for "last edited by" (from API). */
export interface PlanEditorInfo {
  id: string;
  name: string;
  email: string;
}

export interface Plan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price: number;
  maxUsers: number;
  maxLocations: number;
  maxFacilities: number;
  maxEmployees: number;
  features: PlanFeatures;
  isActive: boolean;
  isDefault: boolean;
  isCustom: boolean | null;
  createdById: string | null;
  updatedById: string | null;
  /** Resolved editor user (name, email) when fetching plan by id. */
  updatedBy?: PlanEditorInfo | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanCreateInput {
  name: string;
  code: string;
  description?: string | null;
  price: number;
  maxUsers: number;
  maxLocations: number;
  maxFacilities: number;
  maxEmployees: number;
  features?: PlanFeatures;
  isActive?: boolean;
  isDefault?: boolean;
  isCustom?: boolean | null;
}

/** Code cannot be modified after creation; omit from update. */
export interface PlanUpdateInput {
  name?: string;
  description?: string | null;
  price?: number;
  maxUsers?: number;
  maxLocations?: number;
  maxFacilities?: number;
  maxEmployees?: number;
  features?: PlanFeatures;
  isActive?: boolean;
  isDefault?: boolean;
  isCustom?: boolean | null;
}

/** Known feature keys for the plan features JSON (used in UI) */
export const PLAN_FEATURE_KEYS = ["reports", "auditLogs"] as const;

// Agencies -------------------------------------------------------------------

/** Editor info for "last edited by" (from API). */
export interface AgencyEditorInfo {
  id: string;
  name: string;
  email: string;
}

export interface AgencyListItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  planName: string | null;
  planCode: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: AgencyEditorInfo | null;
  userCount?: number;
}

export interface AgenciesResponse {
  data: AgencyListItem[];
  meta: PaginationMeta;
}

export interface CreateAgencyInput {
  name: string;
  slug: string;
  planId: string;
  adminEmail: string;
  adminPassword: string;
  adminName?: string;
}

export interface PlatformUserListItem {
  id: string;
  email: string;
  role: string;
  agencyName: string | null;
  status: string;
  createdAt: string;
  name?: string | null;
}

export interface PlatformUserDetail extends PlatformUserListItem {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  agencyId: string | null;
  lastLoginAt: string | null;
  updatedAt: string;
}

export interface UsersResponse {
  data: PlatformUserListItem[];
  meta: PaginationMeta;
}

export interface ImpersonateResponse {
  accessToken: string;
  expiresIn: number;
}

export interface SuperadminAuditEntry {
  id: string;
  action: string;
  actorUserId: string;
  actorEmail: string;
  targetAgencyId: string | null;
  targetUserId: string | null;
  metadata: Record<string, unknown> | null;
  impersonation: boolean;
  createdAt: string;
}

export interface AuditLogsResponse {
  data: SuperadminAuditEntry[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export async function getSystemSettings(): Promise<SystemSettingsDTO> {
  const { data } = await api.get<ApiSuccess<SystemSettingsDTO>>("/superadmin/system-settings");
  return data.data;
}

// Plan API -------------------------------------------------------------------

export async function getPlans(params?: { activeOnly?: boolean }): Promise<Plan[]> {
  const sp = new URLSearchParams();
  if (params?.activeOnly) sp.set("activeOnly", "true");
  const q = sp.toString();
  const { data } = await api.get<ApiSuccess<Plan[]>>(
    `/superadmin/plans${q ? `?${q}` : ""}`
  );
  return data.data;
}

export async function getPlanById(planId: string): Promise<Plan | null> {
  const { data } = await api.get<ApiSuccess<Plan>>(`/superadmin/plans/${planId}`);
  return data.data;
}

export async function createPlan(input: PlanCreateInput): Promise<Plan> {
  const { data } = await api.post<ApiSuccess<Plan>>("/superadmin/plans", input);
  return data.data;
}

export async function updatePlan(planId: string, input: PlanUpdateInput): Promise<Plan> {
  const { data } = await api.patch<ApiSuccess<Plan>>(`/superadmin/plans/${planId}`, input);
  return data.data;
}

export async function deletePlan(planId: string): Promise<void> {
  await api.delete<ApiSuccess<{ id: string }>>(`/superadmin/plans/${planId}`);
}

export async function updateSystemSettings(
  input: SystemSettingsUpdateInput
): Promise<SystemSettingsDTO> {
  const { data } = await api.patch<ApiSuccess<SystemSettingsDTO>>("/superadmin/system-settings", input);
  return data.data;
}

export type AgencyStatus = "ACTIVE" | "DISABLED" | "SUSPENDED" | "DELETED";

export async function getAgencies(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
  search?: string;
}): Promise<AgenciesResponse> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.order) sp.set("order", params.order);
  if (params?.search) sp.set("search", params.search);
  const q = sp.toString();
  const res = await api.get<{ success: true; data: AgencyListItem[]; meta: PaginationMeta }>(
    `/superadmin/agencies${q ? `?${q}` : ""}`
  );
  return { data: res.data.data, meta: res.data.meta };
}

/** Fetches a single agency. Throws on 404 or network error. */
export async function getAgencyById(agencyId: string): Promise<AgencyListItem> {
  const { data } = await api.get<ApiSuccess<AgencyListItem>>(`/superadmin/agencies/${agencyId}`);
  return data.data;
}

export async function createAgency(input: CreateAgencyInput): Promise<AgencyListItem> {
  const { data } = await api.post<ApiSuccess<AgencyListItem>>("/superadmin/agencies", input);
  return data.data;
}

export async function updateAgency(
  agencyId: string,
  input: { name?: string; planId?: string | null; status?: AgencyStatus }
): Promise<AgencyListItem> {
  const { data } = await api.patch<ApiSuccess<AgencyListItem>>(
    `/superadmin/agencies/${agencyId}`,
    input
  );
  return data.data;
}

export async function updateAgencyStatus(
  agencyId: string,
  status: AgencyStatus
): Promise<AgencyListItem> {
  const { data } = await api.patch<ApiSuccess<AgencyListItem>>(
    `/superadmin/agencies/${agencyId}`,
    { status }
  );
  return data.data;
}

export async function deleteAgency(agencyId: string): Promise<AgencyListItem> {
  const { data } = await api.delete<ApiSuccess<AgencyListItem>>(
    `/superadmin/agencies/${agencyId}`
  );
  return data.data;
}

export async function suspendAgency(agencyId: string): Promise<AgencyListItem> {
  const { data } = await api.patch<ApiSuccess<AgencyListItem>>(
    `/superadmin/agencies/${agencyId}/suspend`
  );
  return data.data;
}

export async function activateAgency(agencyId: string): Promise<AgencyListItem> {
  const { data } = await api.patch<ApiSuccess<AgencyListItem>>(
    `/superadmin/agencies/${agencyId}/activate`
  );
  return data.data;
}

export async function loginAsAgency(agencyId: string): Promise<ImpersonateResponse> {
  const { data } = await api.post<ApiSuccess<ImpersonateResponse>>(
    `/superadmin/agencies/${agencyId}/login-as`
  );
  return data.data;
}

export interface CreateUserInput {
  agencyId: string;
  email: string;
  password: string;
  role: "AGENCY_ADMIN" | "AGENCY_MEMBER" | "USER";
  name?: string;
}

export async function createUser(input: CreateUserInput): Promise<PlatformUserListItem> {
  const { data } = await api.post<ApiSuccess<PlatformUserListItem>>("/superadmin/users", input);
  return data.data;
}

export async function getUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  agencyId?: string | null;
}): Promise<UsersResponse> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.search) sp.set("search", params.search);
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.order) sp.set("order", params.order);
  if (params?.agencyId) sp.set("agencyId", params.agencyId);
  const q = sp.toString();
  const res = await api.get<{ success: true; data: PlatformUserListItem[]; meta: PaginationMeta }>(
    `/superadmin/users${q ? `?${q}` : ""}`
  );
  return { data: res.data.data, meta: res.data.meta };
}

export async function getUserById(userId: string): Promise<PlatformUserDetail | null> {
  const { data } = await api.get<ApiSuccess<PlatformUserDetail>>(`/superadmin/users/${userId}`);
  return data.data;
}

export async function disableUser(userId: string): Promise<PlatformUserDetail> {
  const { data } = await api.patch<ApiSuccess<PlatformUserDetail>>(
    `/superadmin/users/${userId}/disable`
  );
  return data.data;
}

export async function enableUser(userId: string): Promise<PlatformUserDetail> {
  const { data } = await api.patch<ApiSuccess<PlatformUserDetail>>(
    `/superadmin/users/${userId}/enable`
  );
  return data.data;
}

export async function setUserRole(
  userId: string,
  role: "AGENCY_ADMIN" | "AGENCY_MEMBER" | "USER"
): Promise<PlatformUserDetail> {
  const { data } = await api.patch<ApiSuccess<PlatformUserDetail>>(
    `/superadmin/users/${userId}/role`,
    { role }
  );
  return data.data;
}

export async function resetUserPassword(userId: string): Promise<{ temporaryPassword: string }> {
  const { data } = await api.patch<ApiSuccess<{ temporaryPassword: string }>>(
    `/superadmin/users/${userId}/reset-password`
  );
  return data.data;
}

export async function impersonate(agencyId: string): Promise<ImpersonateResponse> {
  const { data } = await api.post<ApiSuccess<ImpersonateResponse>>("/superadmin/impersonate", {
    agencyId,
  });
  return data.data;
}

export async function stopImpersonation(): Promise<ImpersonateResponse> {
  const { data } = await api.post<ApiSuccess<ImpersonateResponse>>("/superadmin/stop");
  return data.data;
}

interface SuperadminAuditApiResponse {
  success: true;
  code: string;
  message: string;
  data: SuperadminAuditEntry[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export async function getSuperadminAuditLogs(params: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<AuditLogsResponse> {
  const searchParams = new URLSearchParams();
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.limit != null) searchParams.set("limit", String(params.limit));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  const query = searchParams.toString();
  const res = await api.get<SuperadminAuditApiResponse>(
    `/superadmin/audit${query ? `?${query}` : ""}`
  );
  const body = res.data as unknown as SuperadminAuditApiResponse;
  return { data: body.data, meta: body.meta };
}
