import api from './api'
import type {
  ApiResponse, User, Class, Child, Observation,
  Prediction, ModelHistory, DashboardStats, LoginForm, ObservationForm, ChildForm
} from '@/types'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: LoginForm) =>
    api.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  refresh: () => api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getGuruStats: () =>
    api.get<ApiResponse<DashboardStats>>('/dashboard/guru'),

  getAdminStats: () =>
    api.get<ApiResponse<DashboardStats>>('/dashboard/admin'),

  getParentStats: () =>
    api.get('/dashboard/parent'),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    api.get<ApiResponse<User[]>>('/users', { params }),

  getMe: () => api.get<ApiResponse<User>>('/users/me'),

  create: (data: Partial<User> & { password: string }) =>
    api.post<ApiResponse<User>>('/users', data),

  update: (id: string, data: Partial<User> & { password?: string }) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data),

  delete: (id: string) => api.delete(`/users/${id}`),
}

// ── Classes ───────────────────────────────────────────────────────────────────
export const classesApi = {
  getAll: (params?: { page?: number; search?: string }) =>
    api.get<ApiResponse<Class[]>>('/classes', { params }),

  getById: (id: string) => api.get<ApiResponse<Class>>(`/classes/${id}`),

  getStats: (id: string) => api.get(`/classes/${id}/stats`),

  create: (data: { name: string; teacher_id: string; academic_year?: string }) =>
    api.post<ApiResponse<Class>>('/classes', data),

  update: (id: string, data: Partial<Class>) =>
    api.put<ApiResponse<Class>>(`/classes/${id}`, data),

  delete: (id: string) => api.delete(`/classes/${id}`),
}

// ── Children ──────────────────────────────────────────────────────────────────
export const childrenApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; class_id?: string }) =>
    api.get<ApiResponse<Child[]>>('/children', { params }),

  getById: (id: string) => api.get<ApiResponse<Child>>(`/children/${id}`),

  create: (data: ChildForm | FormData) =>
    api.post<ApiResponse<Child>>('/children', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),

  update: (id: string, data: Partial<ChildForm> | FormData) =>
    api.put<ApiResponse<Child>>(`/children/${id}`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),

  delete: (id: string) => api.delete(`/children/${id}`),
}

// ── Observations ──────────────────────────────────────────────────────────────
export const observationsApi = {
  getAll: (params?: { page?: number; limit?: number; child_id?: string; status?: string }) =>
    api.get<ApiResponse<Observation[]>>('/observations', { params }),

  getById: (id: string) => api.get<ApiResponse<Observation>>(`/observations/${id}`),

  create: (data: ObservationForm | FormData) =>
    api.post<ApiResponse<Observation>>('/observations', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),

  update: (id: string, data: Partial<ObservationForm>) =>
    api.put<ApiResponse<Observation>>(`/observations/${id}`, data),

  delete: (id: string) => api.delete(`/observations/${id}`),

  predict: (id: string) =>
    api.post<ApiResponse<Prediction>>(`/observations/${id}/predict`),
}

// ── Predictions ───────────────────────────────────────────────────────────────
export const predictionsApi = {
  getAll: (params?: { page?: number; limit?: number; child_id?: string; class_id?: string }) =>
    api.get<ApiResponse<Prediction[]>>('/predictions', { params }),

  getLatestByChild: (childId: string) =>
    api.get<ApiResponse<Prediction>>(`/predictions/child/${childId}/latest`),

  getDistribution: (classId?: string) =>
    api.get('/predictions/distribution', { params: classId ? { class_id: classId } : {} }),

  getSummary: () => api.get('/predictions/summary'),
}

// ── Model ─────────────────────────────────────────────────────────────────────
export const modelApi = {
  getMetrics: () => api.get('/models/metrics'),

  getHistory: () => api.get<ApiResponse<ModelHistory[]>>('/models/history'),

  retrain: (parameters?: Record<string, unknown>) =>
    api.post('/models/retrain', { parameters }),
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  getChildReport: (childId: string) =>
    api.get(`/reports/child/${childId}`),

  getBukuPenghubungData: (childId: string, params?: { note?: string; period?: string }) =>
    api.get(`/reports/buku/${childId}/data`, { params }),

  getBukuPenghubungHtml: (childId: string, params?: { note?: string; period?: string }) =>
    `/api/reports/buku/${childId}/html?${new URLSearchParams(params as Record<string, string>).toString()}`,

  exportCsv: (classId?: string) =>
    api.get('/reports/export', {
      params: { format: 'csv', ...(classId && { class_id: classId }) },
      responseType: 'blob',
    }),

  getRecommendations: (category?: string) =>
    api.get(`/reports/recommendations${category ? `/${encodeURIComponent(category)}` : ''}`),
}

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const auditApi = {
  getAll: (params?: { page?: number; action?: string; from?: string; to?: string }) =>
    api.get('/audit-logs', { params }),

  getRecent: (limit = 10) =>
    api.get('/audit-logs/recent', { params: { limit } }),
}
