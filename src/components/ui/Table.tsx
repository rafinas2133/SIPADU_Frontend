import { useState, type ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/utils'
import { Pagination } from './index'

// ── Column definition ─────────────────────────────────────────────────────────
export interface Column<T> {
  key:        string
  header:     string
  cell:       (row: T, index: number) => ReactNode
  sortable?:  boolean
  width?:     string
  align?:     'left' | 'center' | 'right'
  className?: string
}

// ── Sort state ────────────────────────────────────────────────────────────────
interface SortState {
  key:       string | null
  direction: 'asc' | 'desc'
}

// ── DataTable props ───────────────────────────────────────────────────────────
interface DataTableProps<T> {
  columns:        Column<T>[]
  data:           T[]
  keyField?:      keyof T
  loading?:       boolean
  emptyMessage?:  string
  emptyIcon?:     ReactNode
  emptyAction?:   ReactNode
  // Pagination
  page?:          number
  totalPages?:    number
  total?:         number
  onPageChange?:  (p: number) => void
  // Callbacks
  onRowClick?:    (row: T) => void
  // Extras
  stickyHeader?:  boolean
  striped?:       boolean
  compact?:       boolean
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField = 'id' as keyof T,
  loading = false,
  emptyMessage = 'Tidak ada data',
  emptyIcon,
  emptyAction,
  page,
  totalPages,
  total,
  onPageChange,
  onRowClick,
  stickyHeader = false,
  striped = false,
  compact = false,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>({ key: null, direction: 'asc' })

  const handleSort = (key: string) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    )
  }

  // Client-side sort (if no server sort)
  const sorted = sort.key
    ? [...data].sort((a, b) => {
        const av = a[sort.key!]
        const bv = b[sort.key!]
        if (av == null) return 1
        if (bv == null) return -1
        const cmp = String(av).localeCompare(String(bv), 'id', { numeric: true })
        return sort.direction === 'asc' ? cmp : -cmp
      })
    : data

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (!sort.key || sort.key !== colKey) return <ChevronsUpDown size={13} className="opacity-30" />
    return sort.direction === 'asc'
      ? <ChevronUp size={13} className="text-blue-600" />
      : <ChevronDown size={13} className="text-blue-600" />
  }

  const cellPad = compact ? 'px-4 py-2' : 'px-4 py-3'

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    'border-b border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-500',
                    'uppercase tracking-wide whitespace-nowrap',
                    cellPad,
                    col.align === 'center' && 'text-center',
                    col.align === 'right'  && 'text-right',
                    !col.align             && 'text-left',
                    col.sortable && 'cursor-pointer hover:bg-slate-100 select-none',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={cn(
                    'flex items-center gap-1',
                    col.align === 'center' && 'justify-center',
                    col.align === 'right'  && 'justify-end',
                  )}>
                    {col.header}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className={cn(cellPad, 'border-b border-slate-50')}>
                      <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    {emptyIcon && (
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        {emptyIcon}
                      </div>
                    )}
                    <p className="text-sm text-slate-500 font-medium">{emptyMessage}</p>
                    {emptyAction}
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={String(row[keyField] ?? i)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-slate-50 last:border-0 transition-colors',
                    striped && i % 2 === 1 && 'bg-slate-50/40',
                    onRowClick && 'cursor-pointer hover:bg-blue-50/40',
                    !onRowClick && 'hover:bg-slate-50/60',
                    'animate-fade-in',
                  )}
                  style={{ animationDelay: `${Math.min(i * 25, 200)}ms` }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        cellPad, 'text-slate-700',
                        col.align === 'center' && 'text-center',
                        col.align === 'right'  && 'text-right',
                        col.className,
                      )}
                    >
                      {col.cell(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {page && totalPages && onPageChange && (
        <div className="px-4 pb-4 mt-1">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total ?? sorted.length}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}
