// ── Auth & User ──────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'guru' | 'orang_tua'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
}

// ── Class & Child ─────────────────────────────────────────────────────────────

export interface Class {
  id: string
  name: string
  academic_year: string
  description?: string
  teacher?: Pick<User, 'id' | 'name' | 'email'>
  student_count?: number
  created_at: string
}

export interface Child {
  id: string
  nis: string
  name: string
  birth_date: string
  gender: 'L' | 'P'
  class_id: string
  parent_user_id?: string
  photo_path?: string
  notes?: string
  class?: Class
  observations?: Observation[]
  latest_prediction?: Prediction
  created_at: string
}

// ── Observation ───────────────────────────────────────────────────────────────

export type LikertScore = 1 | 2 | 3 | 4
export type ObservationStatus = 'draft' | 'final'

export interface ObservationScores {
  bahasa: LikertScore
  motorik_halus: LikertScore
  motorik_kasar: LikertScore
  kognitif: LikertScore
  sosial_emosional: LikertScore
}

export interface Observation extends ObservationScores {
  id: string
  child_id: string
  teacher_id: string
  observation_date: string
  note?: string
  attachment_path?: string
  status: ObservationStatus
  child?: Pick<Child, 'id' | 'name' | 'nis'>
  teacher?: Pick<User, 'id' | 'name'>
  prediction?: Prediction
  created_at: string
  updated_at: string
}

// ── Prediction ────────────────────────────────────────────────────────────────

export type TalentCategory = 'Linguistik' | 'Seni' | 'Kinestetik' | 'Butuh Stimulasi'

export interface Prediction {
  id: string
  observation_id: string
  child_id: string
  prediction: TalentCategory
  confidence: number
  probabilities: Record<TalentCategory, number>
  model_version: string
  created_at: string
  observation?: Pick<Observation, 'id' | 'observation_date'>
  child?: Pick<Child, 'id' | 'name' | 'nis'> & { class?: Pick<Class, 'id' | 'name'> }
}

// ── Model / CART ──────────────────────────────────────────────────────────────

export interface ModelHistory {
  id: string
  version: string
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  training_samples: number
  confusion_matrix: number[][]
  parameters: Record<string, unknown>
  is_active: boolean
  created_at: string
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export interface DashboardOverview {
  total_classes?: number
  total_students?: number
  total_children?: number
  observed_students?: number
  unobserved_students?: number
  total_observations?: number
  draft_observations?: number
  total_predictions?: number
  observed_percentage?: number
  total_users?: number
  total_guru?: number
  total_orang_tua?: number
}

export interface DashboardStats {
  overview: DashboardOverview
  active_model: { version: string; accuracy: number; f1_score: number } | null
  talent_distribution: Array<{ prediction: TalentCategory; count: number }>
  recent_activity_chart: Array<{ date: string; count: number }>
}

// ── Child report (GET /reports/child/:id) ─────────────────────────────────────

export interface ChildReportPrediction {
  prediction: TalentCategory
  confidence: number
  probabilities: Record<TalentCategory, number>
  model_version: string
}

export interface ChildReport {
  child: {
    id: string
    name: string
    nis: string
    birth_date: string
    age?: { years: number; months: number }
    gender?: string
    class_name?: string
    teacher_name?: string
  }
  latest_observation?: {
    date: string
    scores?: Record<string, number>
    score_labels?: Record<string, string>
    note?: string | null
  } | null
  latest_prediction: ChildReportPrediction | null
  prediction: {
    category: TalentCategory
    confidence: number
    probabilities: Record<TalentCategory, number>
    model_version: string
  } | null
  progress_timeline: Array<{
    date: string
    bahasa: number
    motorik_halus: number
    motorik_kasar: number
    kognitif: number
    sosial_emosional: number
    prediction: TalentCategory | null
  }>
  average_scores: Record<string, number>
  recommendations: string[]
  total_observations: number
  period?: string
  teacher_note?: string
  generated_at?: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: PaginationMeta
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// ── Form types ────────────────────────────────────────────────────────────────

export interface LoginForm {
  email: string
  password: string
}

export interface ObservationForm extends ObservationScores {
  child_id: string
  observation_date: string
  note?: string
  status: ObservationStatus
}

export interface ChildForm {
  nis: string
  name: string
  birth_date: string
  gender: 'L' | 'P'
  class_id: string
  parent_user_id?: string
  notes?: string
}

// ── Utility ───────────────────────────────────────────────────────────────────

export const TALENT_COLORS: Record<TalentCategory, string> = {
  Linguistik: '#2563EB',
  Seni: '#10B981',
  Kinestetik: '#F59E0B',
  'Butuh Stimulasi': '#EF4444',
}

export const TALENT_BG: Record<TalentCategory, string> = {
  Linguistik: 'bg-blue-50 text-blue-700',
  Seni: 'bg-emerald-50 text-emerald-700',
  Kinestetik: 'bg-amber-50 text-amber-700',
  'Butuh Stimulasi': 'bg-red-50 text-red-700',
}

export const LIKERT_LABELS: Record<LikertScore, string> = {
  1: 'Belum Berkembang',
  2: 'Mulai Berkembang',
  3: 'Berkembang Sesuai Harapan',
  4: 'Berkembang Sangat Baik',
}

export const LIKERT_SHORT: Record<LikertScore, string> = {
  1: 'BB', 2: 'MB', 3: 'BSH', 4: 'BSB',
}
