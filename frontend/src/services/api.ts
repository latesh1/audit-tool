import axios from 'axios';
import { AuditDetail, AuditSummary, DashboardData, AiStatusData, SystemInfoData } from '../types/audit';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 45000,
});

export interface CreateAuditPayload {
  primary_url: string;
  competitor_urls?: string[];
  industry?: string;
  target_audience?: string;
  main_service?: string;
  audit_objective?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

export const auditApi = {
  getDashboard: async (): Promise<DashboardData> => {
    const res = await apiClient.get<{ data: DashboardData }>('/dashboard');
    return res.data.data;
  },

  getAudits: async (params?: { page?: number; per_page?: number; status?: string; search?: string }): Promise<PaginatedResponse<AuditSummary>> => {
    const res = await apiClient.get<PaginatedResponse<AuditSummary>>('/audits', { params });
    return res.data;
  },

  getAudit: async (id: number | string): Promise<AuditDetail> => {
    const res = await apiClient.get<{ data: AuditDetail }>(`/audits/${id}`);
    return res.data.data;
  },

  getAuditStatus: async (id: number | string) => {
    const res = await apiClient.get<{ data: { id: number; status: string; progress: number; overall_score: number | null } }>(`/audits/${id}/status`);
    return res.data.data;
  },

  createAudit: async (payload: CreateAuditPayload): Promise<AuditDetail> => {
    const res = await apiClient.post<{ data: AuditDetail }>('/audits', payload);
    return res.data.data;
  },

  deleteAudit: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/audits/${id}`);
  },

  getAiStatus: async (): Promise<AiStatusData> => {
    const res = await apiClient.get<{ data: AiStatusData }>('/settings/ai-status');
    return res.data.data;
  },

  getSystemInfo: async (): Promise<SystemInfoData> => {
    const res = await apiClient.get<{ data: SystemInfoData }>('/settings/system-info');
    return res.data.data;
  },

  getHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },
};
