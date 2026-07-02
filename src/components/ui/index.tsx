import { useEffect, useState, type ReactNode } from 'react'
import { Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn, talentBadge, talentEmoji, talentColor, likertShort, likertColor, toConfidence } from '@/utils'
import type { LikertScore, TalentCategory } from '@/types'

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin text-blue-600', className)} size={24} />
}

// ── PageLoader ────────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <Spinner />
      <p className="text-sm text-slate-400">Memuat...</p>
    </div>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="text-4xl mb-3 opacity-60">📭</div>
      <h3 className="font-semibold text-slate-800">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: number | string
  subtitle?: string
  icon?: ReactNode
  accent?: string
  iconBg?: string
  iconColor?: string
  delay?: number
  trend?: { value: number; label: string }
}

export function StatCard({
  label,
  value,
  subtitle,
  icon,
  accent = 'border-blue-500',
  iconBg = 'bg-blue-50',
  iconColor = 'text-blue-600',
  delay = 0,
  trend,
}: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : null
  const [display, setDisplay] = useState(numericValue ?? value)

  useEffect(() => {
    if (numericValue === null) {
      setDisplay(value)
      return
    }
    let frame: number
    const start = performance.now()
    const duration = 600
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setDisplay(Math.round(numericValue * progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    const timeout = setTimeout(() => { frame = requestAnimationFrame(tick) }, delay)
    return () => { clearTimeout(timeout); cancelAnimationFrame(frame) }
  }, [numericValue, value, delay])

  return (
    <div
      className={cn('card p-4 border-l-4 animate-fade-in', accent)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{display}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          {trend && (
            <p className="text-[10px] text-slate-400 mt-1">
              {trend.value} {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg, iconColor)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

// ── TalentBadge ───────────────────────────────────────────────────────────────
export function TalentBadge({
  category,
  showEmoji = true,
  className,
}: {
  category: TalentCategory
  showEmoji?: boolean
  className?: string
}) {
  return (
    <span className={cn('badge text-xs', talentBadge(category), className)}>
      {showEmoji && <span>{talentEmoji(category)}</span>}
      {category}
    </span>
  )
}

// ── ConfidenceBar ─────────────────────────────────────────────────────────────
export function ConfidenceBar({ value, className }: { value: unknown; className?: string }) {
  const pct = Math.min(Math.max(toConfidence(value), 0), 100)
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: pct >= 75 ? '#10B981' : pct >= 60 ? '#2563EB' : '#F59E0B' }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-700 tabular-nums w-10 text-right">
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

// ── LikertDisplay ─────────────────────────────────────────────────────────────
export function LikertDisplay({
  score,
  label,
}: {
  score: LikertScore
  label?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('badge text-xs font-bold', likertColor(score))}>
        {likertShort(score)}
      </span>
      {label && <span className="text-xs text-slate-600">{label}</span>}
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number
  totalPages: number
  total?: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-slate-500">
        {total !== undefined ? `${total} data · ` : ''}Halaman {page} dari {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn-ghost btn-sm p-1.5"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn-ghost btn-sm p-1.5"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({
  open = true,
  title,
  children,
  onClose,
  size = 'md',
}: {
  open?: boolean
  title: string
  children: ReactNode
  onClose: () => void
  size?: 'sm' | 'md' | 'lg'
}) {
  if (!open) return null

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in', sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  loading = false,
  variant = 'danger',
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  variant?: 'danger' | 'primary'
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-fade-in">
        <h2 className="font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600 mt-2">{message}</p>
        <div className="flex gap-3 justify-end mt-6">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
          >
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export { DataTable, type Column } from './Table'
