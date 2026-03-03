import { api, buildListParams, type ApiPaginated, type ApiSuccess } from "@/services/api";

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  createdAt: string;
}

export async function getAuditLogs(params: { page?: number; limit?: number } = {}) {
  const query = buildListParams({
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  });
  const { data } = await api.get<ApiPaginated<AuditLogEntry>>(`/audit-logs${query}`);
  return { data: data.data, meta: data.meta };
}
