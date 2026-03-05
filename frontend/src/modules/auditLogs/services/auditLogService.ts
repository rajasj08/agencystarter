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

export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
} = {}) {
  const query = buildListParams({
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });
  const { data } = await api.get<ApiPaginated<AuditLogEntry>>(`/audit-logs${query}`);
  return { data: data.data, meta: data.meta };
}
