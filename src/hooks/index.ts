import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  authApi, dashboardApi, usersApi, classesApi, childrenApi,
  observationsApi, predictionsApi, modelApi, reportsApi, auditApi,
} from '@/services'
import { useAuthStore } from '@/stores/auth.store'
import { fConfidence, normalizeChildReport } from '@/utils'
import type { LoginForm, ObservationForm, ChildForm } from '@/types'

// ── Auth hooks ────────────────────────────────────────────────────────────────
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: (data: LoginForm) => authApi.login(data),
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.accessToken)
      toast.success(`Selamat datang, ${data.data.user.name}!`)
    },
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout()
      window.location.href = '/login'
    },
  })
}

export function useMe() {
  const isAuth = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.getMe().then((r) => r.data.data),
    enabled: isAuth,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Dashboard hooks ───────────────────────────────────────────────────────────
export function useGuruDashboard() {
  const role = useAuthStore((s) => s.user?.role)
  return useQuery({
    queryKey: ['dashboard', 'guru'],
    queryFn: () => dashboardApi.getGuruStats().then((r) => r.data.data),
    refetchInterval: 60_000,
    enabled: role === 'guru',
  })
}

export function useAdminDashboard() {
  const role = useAuthStore((s) => s.user?.role)
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => dashboardApi.getAdminStats().then((r) => r.data.data),
    refetchInterval: 60_000,
    enabled: role === 'admin',
  })
}

export function useParentDashboard() {
  const role = useAuthStore((s) => s.user?.role)
  return useQuery({
    queryKey: ['dashboard', 'parent'],
    queryFn: () => dashboardApi.getParentStats().then((r) => r.data.data),
    refetchInterval: 60_000,
    enabled: role === 'orang_tua',
  })
}

// ── User hooks ────────────────────────────────────────────────────────────────
export function useUsers(params?: { page?: number; limit?: number; search?: string; role?: string }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.getAll(params).then((r) => r.data),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Pengguna berhasil dibuat') },
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof usersApi.update>[1] }) =>
      usersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Data pengguna diperbarui') },
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Pengguna dinonaktifkan') },
  })
}

// ── Class hooks ───────────────────────────────────────────────────────────────
export function useClasses(params?: { page?: number; search?: string }) {
  return useQuery({
    queryKey: ['classes', params],
    queryFn: () => classesApi.getAll(params).then((r) => r.data),
  })
}

export function useClass(id: string) {
  return useQuery({
    queryKey: ['classes', id],
    queryFn: () => classesApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useCreateClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: classesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Kelas berhasil dibuat')
    },
  })
}

export function useUpdateClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof classesApi.update>[1] }) =>
      classesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Kelas diperbarui')
    },
  })
}

export function useDeleteClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: classesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Kelas berhasil dihapus')
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message ?? 'Gagal menghapus kelas')
    },
  })
}

// ── Children hooks ────────────────────────────────────────────────────────────
export function useChildren(params?: { page?: number; limit?: number; search?: string; class_id?: string }) {
  return useQuery({
    queryKey: ['children', params],
    queryFn: () => childrenApi.getAll(params).then((r) => r.data),
  })
}

export function useChild(id: string) {
  return useQuery({
    queryKey: ['children', id],
    queryFn: () => childrenApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useCreateChild() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ChildForm | FormData) => childrenApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['children'] }); toast.success('Siswa berhasil ditambahkan') },
  })
}

export function useUpdateChild() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ChildForm> | FormData }) =>
      childrenApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['children'] })
      qc.invalidateQueries({ queryKey: ['children', id] })
      toast.success('Data siswa diperbarui')
    },
  })
}

export function useDeleteChild() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: childrenApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['children'] }); toast.success('Data siswa dihapus') },
  })
}

// ── Observation hooks ─────────────────────────────────────────────────────────
export function useObservations(params?: { page?: number; limit?: number; child_id?: string; status?: string }) {
  return useQuery({
    queryKey: ['observations', params],
    queryFn: () => observationsApi.getAll(params).then((r) => r.data),
  })
}

export function useObservation(id: string) {
  return useQuery({
    queryKey: ['observations', id],
    queryFn: () => observationsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useCreateObservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ObservationForm | FormData) => observationsApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['observations'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['children'] })
      qc.invalidateQueries({ queryKey: ['predictions'] })
      const pred = res.data.data?.prediction
      if (pred) {
        toast.success(`Prediksi: ${pred.prediction} (${fConfidence(pred.confidence, 0)}%)`)
      } else {
        toast.success('Observasi berhasil disimpan')
      }
    },
  })
}

export function useUpdateObservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ObservationForm> }) =>
      observationsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['observations'] })
      toast.success('Observasi diperbarui')
    },
  })
}

export function useDeleteObservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: observationsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['observations'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Observasi dihapus')
    },
  })
}

export function useRunPrediction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => observationsApi.predict(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['observations'] })
      qc.invalidateQueries({ queryKey: ['predictions'] })
      const pred = res.data.data
      toast.success(`Prediksi diperbarui: ${pred.prediction} (${fConfidence(pred.confidence, 0)}%)`)
    },
  })
}

// ── Prediction hooks ──────────────────────────────────────────────────────────
export function usePredictions(params?: { page?: number; limit?: number; child_id?: string; class_id?: string }) {
  return useQuery({
    queryKey: ['predictions', params],
    queryFn: () => predictionsApi.getAll(params).then((r) => r.data),
  })
}

export function useLatestPrediction(childId: string) {
  return useQuery({
    queryKey: ['predictions', 'latest', childId],
    queryFn: () => predictionsApi.getLatestByChild(childId).then((r) => r.data.data),
    enabled: !!childId,
  })
}

export function usePredictionDistribution(classId?: string) {
  const isAuth = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: ['predictions', 'distribution', classId],
    queryFn: () => predictionsApi.getDistribution(classId).then((r) => r.data.data),
    enabled: isAuth,
  })
}

// ── Model hooks ───────────────────────────────────────────────────────────────
export function useModelMetrics() {
  return useQuery({
    queryKey: ['model', 'metrics'],
    queryFn: () => modelApi.getMetrics().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useModelHistory() {
  return useQuery({
    queryKey: ['model', 'history'],
    queryFn: () => modelApi.getHistory().then((r) => r.data.data),
  })
}

export function useRetrain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params?: Record<string, unknown>) => modelApi.retrain(params),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['model'] })
      const acc = (res.data.data?.metrics?.accuracy * 100).toFixed(1)
      toast.success(`Training selesai! Akurasi: ${acc}%`)
    },
  })
}

// ── Report hooks ──────────────────────────────────────────────────────────────
export function useChildReport(childId: string) {
  return useQuery({
    queryKey: ['reports', 'child', childId],
    queryFn: () =>
      reportsApi.getChildReport(childId).then((r) => normalizeChildReport(r.data.data as Record<string, unknown>)),
    enabled: !!childId,
  })
}

export function useBukuPenghubungData(childId: string, params?: { note?: string; period?: string }) {
  return useQuery({
    queryKey: ['reports', 'buku', childId, params],
    queryFn: () =>
      reportsApi.getBukuPenghubungData(childId, params).then((r) =>
        normalizeChildReport(r.data.data as Record<string, unknown>),
      ),
    enabled: !!childId,
  })
}

// ── Audit hooks ───────────────────────────────────────────────────────────────
export function useRecentActivity(limit = 8) {
  return useQuery({
    queryKey: ['audit', 'recent', limit],
    queryFn: () => auditApi.getRecent(limit).then((r) => r.data.data),
    refetchInterval: 30_000,
  })
}

export function useAuditLogs(params?: { page?: number; action?: string }) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: () => auditApi.getAll(params).then((r) => r.data),
  })
}
