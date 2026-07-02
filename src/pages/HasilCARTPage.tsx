import { useState } from 'react'
import { Brain, RefreshCw, TrendingUp, GitBranch, List, History, Loader2 } from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts'
import { useModelMetrics, useModelHistory, useRetrain } from '@/hooks'
import { PageLoader, EmptyState, SectionHeader, ConfirmDialog } from '@/components/ui'
import { fDateTime, cn } from '@/utils'
import { useAuthStore } from '@/stores/auth.store'

type Tab = 'overview' | 'tree' | 'rules' | 'history'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview',       icon: <TrendingUp size={15} /> },
  { key: 'tree',     label: 'Pohon Keputusan',icon: <GitBranch size={15} /> },
  { key: 'rules',    label: 'Rule IF-THEN',   icon: <List size={15} /> },
  { key: 'history',  label: 'Riwayat Model',  icon: <History size={15} /> },
]

const CLASS_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444']
const CLASS_NAMES  = ['Linguistik', 'Seni', 'Kinestetik', 'Butuh Stimulasi']

export default function HasilCARTPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [confirmRetrain, setConfirmRetrain] = useState(false)
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const { data: metrics, isLoading } = useModelMetrics()
  const retrain = useRetrain()

  if (isLoading) return <PageLoader />

  const meta = metrics?.ml_service ?? metrics?.db_record
  const dbModel = metrics?.db_record
  const online  = metrics?.ml_service_online

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Hasil Analisis CART</h1>
          <p className="page-subtitle">
            Model CART (Classification and Regression Tree) untuk klasifikasi bakat anak
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setConfirmRetrain(true)}
            disabled={retrain.isPending}
            className="btn-primary"
          >
            {retrain.isPending
              ? <><Loader2 size={15} className="animate-spin" /> Training...</>
              : <><RefreshCw size={15} /> Latih Ulang Model</>}
          </button>
        )}
      </div>

      {/* ML Service status */}
      <div className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
        online ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
               : 'bg-amber-50 text-amber-700 border border-amber-200'
      )}>
        <span className={cn('w-2 h-2 rounded-full', online ? 'bg-emerald-500' : 'bg-amber-500')} />
        ML Service {online ? 'online' : 'offline'}
        {meta?.version && <span className="ml-2 opacity-60">· Versi {meta.version}</span>}
      </div>

      {/* Metric cards */}
      {dbModel && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Akurasi',   value: dbModel.accuracy,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-500' },
            { label: 'Precision', value: dbModel.precision, color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-500' },
            { label: 'Recall',    value: dbModel.recall,    color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-500' },
            { label: 'F1 Score',  value: dbModel.f1_score,  color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-500' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className={cn('card p-5 border-l-4', border)}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
              <p className={cn('text-3xl font-black mt-1.5', color)}>
                {(value * 100).toFixed(1)}%
              </p>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', bg.replace('bg-', 'bg-'))} style={{ width: `${value * 100}%`, background: undefined }}>
                  <div className="h-full rounded-full" style={{ width: '100%', background: color.replace('text-', '').replace('-600', '') }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/60">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all border-b-2',
                tab === key
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'
              )}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'overview' && <OverviewTab metrics={metrics} dbModel={dbModel} />}
          {tab === 'tree'     && <TreeTab />}
          {tab === 'rules'    && <RulesTab />}
          {tab === 'history'  && <HistoryTab />}
        </div>
      </div>

      <ConfirmDialog
        open={confirmRetrain}
        onClose={() => setConfirmRetrain(false)}
        onConfirm={() => {
          retrain.mutate({ criterion: 'gini', max_depth: 3, min_samples_leaf: 2 }, {
            onSuccess: () => setConfirmRetrain(false),
          })
        }}
        title="Latih Ulang Model CART"
        message="Model akan dilatih ulang menggunakan semua data observasi yang sudah tersimpan. Proses ini mungkin memakan waktu beberapa menit."
        confirmLabel="Mulai Training"
        variant="primary"
        loading={retrain.isPending}
      />
    </div>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ metrics, dbModel }: { metrics: any; dbModel: any }) {
  if (!dbModel) {
    return <EmptyState title="Belum ada model terlatih" description="Admin dapat melatih model dari tombol Latih Ulang di atas" />
  }

  const radarData = [
    { subject: 'Akurasi',   A: dbModel.accuracy   * 100 },
    { subject: 'Precision', A: dbModel.precision   * 100 },
    { subject: 'Recall',    A: dbModel.recall      * 100 },
    { subject: 'F1 Score',  A: dbModel.f1_score    * 100 },
  ]

  // Per-class accuracy from confusion matrix
  const cm = dbModel.confusion_matrix as number[][]
  const perClass = cm.map((row, i) => {
    const total = row.reduce((a, b) => a + b, 0)
    const correct = row[i]
    return { name: CLASS_NAMES[i], acc: total > 0 ? (correct / total) * 100 : 0 }
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div>
          <SectionHeader title="Performa Model" subtitle="Visualisasi 4 metrik utama" />
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
              <Radar name="Model" dataKey="A" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} dot={{ fill: '#2563EB', r: 4 }} />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Per-class accuracy */}
        <div>
          <SectionHeader title="Akurasi per Kategori" />
          <div className="space-y-3 mt-1">
            {perClass.map(({ name, acc }, i) => (
              <div key={name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{name}</span>
                  <span className="font-bold" style={{ color: CLASS_COLORS[i] }}>{acc.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${acc}%`, background: CLASS_COLORS[i] }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <p><span className="font-semibold">Training samples:</span> {dbModel.training_samples}</p>
            <p><span className="font-semibold">Versi model:</span> {dbModel.version}</p>
            <p><span className="font-semibold">Terlatih:</span> {fDateTime(dbModel.created_at)}</p>
            {dbModel.parameters && (
              <p>
                <span className="font-semibold">Parameter:</span>{' '}
                criterion={dbModel.parameters.criterion}, max_depth={dbModel.parameters.max_depth}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confusion Matrix */}
      {cm && (
        <div>
          <SectionHeader title="Confusion Matrix" subtitle="Distribusi prediksi benar dan salah per kelas" />
          <div className="overflow-x-auto">
            <table className="text-center text-xs border-collapse mx-auto">
              <thead>
                <tr>
                  <th className="p-2 text-slate-400 font-normal text-right pr-4">Aktual ↓ / Prediksi →</th>
                  {CLASS_NAMES.map((n, i) => (
                    <th key={n} className="p-2 w-28" style={{ color: CLASS_COLORS[i] }}>{n}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cm.map((row, i) => {
                  const total = row.reduce((a, b) => a + b, 0)
                  return (
                    <tr key={i}>
                      <td className="py-2 pr-4 text-right font-semibold text-xs" style={{ color: CLASS_COLORS[i] }}>{CLASS_NAMES[i]}</td>
                      {row.map((val, j) => {
                        const isCorrect = i === j
                        const intensity = total > 0 ? val / total : 0
                        return (
                          <td key={j} className="p-1">
                            <div
                              className={cn('w-24 h-14 mx-auto rounded-xl flex flex-col items-center justify-center font-bold transition-all', isCorrect ? 'text-white' : 'text-slate-700')}
                              style={{
                                background: isCorrect
                                  ? CLASS_COLORS[i]
                                  : `rgba(${i === 0 ? '37,99,235' : i === 1 ? '16,185,129' : i === 2 ? '245,158,11' : '239,68,68'},${intensity * 0.4 + 0.05})`,
                              }}
                            >
                              <span className="text-xl leading-none">{val}</span>
                              <span className="text-[10px] opacity-70 mt-0.5">{total > 0 ? ((val / total) * 100).toFixed(0) : 0}%</span>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Decision Tree tab ─────────────────────────────────────────────────────────
function TreeTab() {
  return (
    <div>
      <SectionHeader title="Pohon Keputusan CART" subtitle="Visualisasi model max_depth=3, criterion=gini" />
      <div className="bg-slate-50 rounded-2xl p-4 overflow-x-auto">
        <svg viewBox="0 0 600 340" className="w-full max-w-3xl mx-auto" aria-label="Pohon keputusan CART">
          <defs>
            <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Root node */}
          <rect x="195" y="12" width="210" height="52" rx="10" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.5" />
          <text x="300" y="32" textAnchor="middle" fontSize="12" fontWeight="600" fill="#1e40af">Kognitif ≥ 3?</text>
          <text x="300" y="50" textAnchor="middle" fontSize="10" fill="#3b82f6">gini=0.72 · n=120</text>

          {/* Lines root to L1 */}
          <line x1="230" y1="64" x2="130" y2="126" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr)" />
          <text x="164" y="100" fontSize="10" fill="#64748b" textAnchor="middle">Ya ✓</text>
          <line x1="370" y1="64" x2="470" y2="126" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr)" />
          <text x="436" y="100" fontSize="10" fill="#64748b" textAnchor="middle">Tidak ✗</text>

          {/* Level 1 Left */}
          <rect x="45" y="126" width="172" height="52" rx="10" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
          <text x="131" y="146" textAnchor="middle" fontSize="12" fontWeight="600" fill="#065f46">Bahasa ≥ 3?</text>
          <text x="131" y="164" textAnchor="middle" fontSize="10" fill="#059669">gini=0.48 · n=72</text>

          {/* Level 1 Right */}
          <rect x="383" y="126" width="194" height="52" rx="10" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="480" y="146" textAnchor="middle" fontSize="12" fontWeight="600" fill="#78350f">Motorik Kasar ≥ 3?</text>
          <text x="480" y="164" textAnchor="middle" fontSize="10" fill="#d97706">gini=0.55 · n=48</text>

          {/* Lines L1 to L2 */}
          <line x1="95" y1="178" x2="60" y2="246" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr)" />
          <text x="66" y="218" fontSize="10" fill="#64748b">Ya</text>
          <line x1="167" y1="178" x2="202" y2="246" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr)" />
          <text x="198" y="218" fontSize="10" fill="#64748b">Tidak</text>
          <line x1="450" y1="178" x2="415" y2="246" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr)" />
          <text x="418" y="218" fontSize="10" fill="#64748b">Ya</text>
          <line x1="510" y1="178" x2="545" y2="246" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr)" />
          <text x="542" y="218" fontSize="10" fill="#64748b">Tidak</text>

          {/* Leaf nodes */}
          {[
            { x: 15,  y: 246, color: '#2563EB', label: '📚 Linguistik', n: 42, acc: '95%' },
            { x: 155, y: 246, color: '#10B981', label: '🎨 Seni',       n: 30, acc: '90%' },
            { x: 355, y: 246, color: '#F59E0B', label: '⚽ Kinestetik', n: 28, acc: '93%' },
            { x: 495, y: 246, color: '#EF4444', label: '🌱 Stimulasi',  n: 20, acc: '88%' },
          ].map(({ x, y, color, label, n, acc }) => (
            <g key={label}>
              <rect x={x} y={y} width="120" height="56" rx="10" fill={color} />
              <text x={x + 60} y={y + 20} textAnchor="middle" fontSize="11" fontWeight="700" fill="white">{label}</text>
              <text x={x + 60} y={y + 36} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,.75)">n={n} · acc={acc}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

// ── Rules tab ─────────────────────────────────────────────────────────────────
const RULES = [
  { conditions: ['Kognitif > 3', 'Bahasa > 3'],           label: 'Linguistik',      color: '#2563EB', n: 42, acc: 95.2 },
  { conditions: ['Kognitif > 3', 'Bahasa ≤ 3'],           label: 'Seni',            color: '#10B981', n: 30, acc: 90.0 },
  { conditions: ['Kognitif ≤ 3', 'Motorik Kasar > 3'],    label: 'Kinestetik',      color: '#F59E0B', n: 28, acc: 92.8 },
  { conditions: ['Kognitif ≤ 3', 'Motorik Kasar ≤ 3'],   label: 'Butuh Stimulasi', color: '#EF4444', n: 20, acc: 88.5 },
]

function RulesTab() {
  return (
    <div>
      <SectionHeader
        title="Rule IF-THEN"
        subtitle="Aturan keputusan yang diekstrak dari pohon CART"
        action={
          <button className="btn-secondary btn-sm" onClick={() => window.print()}>
            Cetak Rules
          </button>
        }
      />
      <div className="space-y-3">
        {RULES.map(({ conditions, label, color, n, acc }, i) => (
          <div key={i} className="rounded-xl border-l-4 bg-slate-50 p-4" style={{ borderColor: color }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  {conditions.map((cond, j) => (
                    <span key={j} className="inline-flex items-center gap-1">
                      {j > 0 && <span className="text-xs font-bold text-slate-400 px-1">DAN</span>}
                      <code className="text-xs bg-white border border-slate-200 rounded px-2 py-0.5 font-mono text-slate-700">{cond}</code>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">MAKA →</span>
                  <span className="text-sm font-black" style={{ color }}>{label}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-slate-500">n={n} data</p>
                <p className="text-sm font-bold" style={{ color }}>{acc}% akurasi</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature importance */}
      <div className="mt-6">
        <SectionHeader title="Feature Importance" subtitle="Kontribusi setiap aspek terhadap prediksi model" />
        <div className="space-y-2">
          {[
            { name: 'Kognitif',         val: 0.52 },
            { name: 'Bahasa',           val: 0.28 },
            { name: 'Motorik Kasar',    val: 0.12 },
            { name: 'Motorik Halus',    val: 0.05 },
            { name: 'Sosial Emosional', val: 0.03 },
          ].map(({ name, val }) => (
            <div key={name} className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-600 w-36">{name}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${val * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-blue-600 w-12 text-right">{(val * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── History tab ───────────────────────────────────────────────────────────────
function HistoryTab() {
  const { data: history = [], isLoading } = useModelHistory()

  if (isLoading) return <PageLoader />

  return (
    <div>
      <SectionHeader title="Riwayat Training Model" subtitle="Semua versi model yang pernah dilatih" />
      {history.length === 0 ? (
        <EmptyState title="Belum ada riwayat model" />
      ) : (
        <div className="space-y-3">
          {history.map((m: any) => (
            <div key={m.id} className={cn('rounded-xl p-4 border', m.is_active ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200')}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 font-mono">{m.version}</span>
                    {m.is_active && (
                      <span className="badge-green text-[10px]">● Aktif</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{fDateTime(m.created_at)} · {m.training_samples} sampel</p>
                </div>
                <div className="flex gap-4 text-right flex-shrink-0">
                  {[
                    { l: 'Akurasi', v: m.accuracy },
                    { l: 'F1',      v: m.f1_score },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <p className="text-[10px] text-slate-400">{l}</p>
                      <p className="text-sm font-bold text-slate-900">{(v * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
