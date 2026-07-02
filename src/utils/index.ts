import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import type { LikertScore, TalentCategory, ChildReport, ChildReportPrediction } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fDate(date: string | Date, fmt = 'd MMMM yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: id })
}

export function fDateShort(date: string | Date) {
  return fDate(date, 'd MMM yyyy')
}

export function fTimeAgo(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: id })
}

export function fDateTime(date: string | Date) {
  return fDate(date, 'd MMM yyyy, HH:mm')
}

export function likertLabel(score: LikertScore): string {
  const map: Record<LikertScore, string> = {
    1: 'Belum Berkembang',
    2: 'Mulai Berkembang',
    3: 'Berkembang Sesuai Harapan',
    4: 'Berkembang Sangat Baik',
  }
  return map[score] ?? '-'
}

export function likertShort(score: LikertScore): string {
  const map: Record<LikertScore, string> = { 1: 'BB', 2: 'MB', 3: 'BSH', 4: 'BSB' }
  return map[score] ?? '-'
}

export function likertColor(score: LikertScore): string {
  const map: Record<LikertScore, string> = {
    1: 'text-red-600 bg-red-50',
    2: 'text-amber-600 bg-amber-50',
    3: 'text-blue-600 bg-blue-50',
    4: 'text-emerald-600 bg-emerald-50',
  }
  return map[score] ?? ''
}

export function talentColor(cat: TalentCategory): string {
  const map: Record<TalentCategory, string> = {
    Linguistik: '#2563EB',
    Seni: '#10B981',
    Kinestetik: '#F59E0B',
    'Butuh Stimulasi': '#EF4444',
  }
  return map[cat] ?? '#6B7280'
}

export function talentBadge(cat: TalentCategory): string {
  const map: Record<TalentCategory, string> = {
    Linguistik: 'bg-blue-50 text-blue-700 border border-blue-200',
    Seni: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Kinestetik: 'bg-amber-50 text-amber-700 border border-amber-200',
    'Butuh Stimulasi': 'bg-red-50 text-red-700 border border-red-200',
  }
  return map[cat] ?? 'bg-slate-100 text-slate-600'
}

export function talentEmoji(cat: TalentCategory): string {
  const map: Record<TalentCategory, string> = {
    Linguistik: '📚',
    Seni: '🎨',
    Kinestetik: '⚽',
    'Butuh Stimulasi': '🌱',
  }
  return map[cat] ?? '❓'
}

export function toConfidence(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function fConfidence(value: unknown, decimals = 0): string {
  return toConfidence(value).toFixed(decimals)
}

export function confidenceLabel(c: unknown): string {
  const n = toConfidence(c)
  if (n >= 90) return 'Sangat Tinggi'
  if (n >= 75) return 'Tinggi'
  if (n >= 60) return 'Sedang'
  return 'Rendah'
}

export function confidenceColor(c: unknown): string {
  const n = toConfidence(c)
  if (n >= 90) return 'text-emerald-600'
  if (n >= 75) return 'text-blue-600'
  if (n >= 60) return 'text-amber-600'
  return 'text-red-600'
}

export function fNumber(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n)
}

export function fPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}

export function genderLabel(g: 'L' | 'P'): string {
  return g === 'L' ? 'Laki-laki' : 'Perempuan'
}

export function calcAge(birthDate: string): string {
  const birth = parseISO(birthDate)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (months < 0) { years--; months += 12 }
  if (years === 0) return `${months} bulan`
  return `${years} thn ${months} bln`
}

export function fileUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `/uploads/${path}`
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Child report normalizer ───────────────────────────────────────────────────
/** API report uses `prediction.category`; legacy/UI expects `latest_prediction.prediction`. */
export function normalizeChildReport(report: Record<string, unknown> | null | undefined): ChildReport | null {
  if (!report) return null

  const rawPred = (report.latest_prediction ?? report.prediction) as Record<string, unknown> | null | undefined
  const timeline = (report.progress_timeline ?? []) as ChildReport['progress_timeline']

  const latest_prediction: ChildReportPrediction | null = rawPred
    ? {
        prediction: (rawPred.prediction ?? rawPred.category) as TalentCategory,
        confidence: toConfidence(rawPred.confidence),
        probabilities: (rawPred.probabilities ?? {}) as Record<TalentCategory, number>,
        model_version: String(rawPred.model_version ?? ''),
      }
    : null

  return {
    ...(report as Omit<ChildReport, 'child' | 'latest_prediction' | 'prediction' | 'total_observations' | 'progress_timeline' | 'recommendations' | 'average_scores'>),
    child: report.child as ChildReport['child'],
    latest_prediction,
    prediction: latest_prediction
      ? {
          category: latest_prediction.prediction,
          confidence: latest_prediction.confidence,
          probabilities: latest_prediction.probabilities,
          model_version: latest_prediction.model_version,
        }
      : (report.prediction as ChildReport['prediction']) ?? null,
    progress_timeline: timeline,
    recommendations: (report.recommendations ?? []) as string[],
    average_scores: (report.average_scores ?? {}) as Record<string, number>,
    total_observations: Number(report.total_observations ?? timeline.length ?? 0),
  }
}
