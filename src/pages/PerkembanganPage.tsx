import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, BookOpen, ArrowRight } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { useParentDashboard, useChildReport } from '@/hooks'
import { PageLoader, TalentBadge, ConfidenceBar, EmptyState } from '@/components/ui'
import { fDate, fDateShort, calcAge, talentColor, likertLabel } from '@/utils'
import type { TalentCategory } from '@/types'

const ASPECT_KEYS   = ['bahasa', 'motorik_halus', 'motorik_kasar', 'kognitif', 'sosial_emosional']
const ASPECT_LABELS: Record<string, string> = {
  bahasa: 'Bahasa', motorik_halus: 'Motorik Halus',
  motorik_kasar: 'Motorik Kasar', kognitif: 'Kognitif',
  sosial_emosional: 'Sos. Emosional',
}
const ASPECT_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function PerkembanganPage() {
  const { data, isLoading } = useParentDashboard()

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)

  if (isLoading) return <PageLoader />

  const children: any[] = data?.children ?? []

  // Auto-select first child
  const activeId = selectedChildId ?? children[0]?.id ?? null
  const activeChild = children.find((c: any) => c.id === activeId) ?? null

  if (children.length === 0) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="page-title">Perkembangan Anak</h1>
          <p className="page-subtitle">Pantau kemajuan belajar dan bakat anak Anda</p>
        </div>
        <EmptyState
          title="Belum ada data anak"
          description="Akun Anda belum terhubung ke data siswa. Hubungi guru untuk menghubungkan akun."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Perkembangan Anak</h1>
        <p className="page-subtitle">Pantau kemajuan belajar dan bakat anak Anda</p>
      </div>

      {/* Child selector (if more than one child) */}
      {children.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {children.map((child: any) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                activeId === child.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center text-blue-700 font-bold text-sm">
                {child.name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">{child.name}</p>
                <p className="text-xs text-slate-500">{child.class?.name ?? '-'}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeChild && <ChildDetail childId={activeChild.id} childData={activeChild} />}
    </div>
  )
}

// ── Child detail section ──────────────────────────────────────────────────────
function ChildDetail({ childId, childData }: { childId: string; childData: any }) {
  const { data: report, isLoading } = useChildReport(childId)

  if (isLoading) return <PageLoader />
  if (!report) return null

  const pred      = report.latest_prediction
  const timeline  = report.progress_timeline ?? []
  const recs      = report.recommendations  ?? []
  const latestObs = report.latest_observation

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center text-blue-700 font-black text-2xl shadow-sm flex-shrink-0">
              {report.child.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{report.child.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {report.child.gender} · {calcAge(report.child.birth_date)} · {report.child.class_name}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Guru: {report.child.teacher_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {pred && <TalentBadge category={pred.prediction as TalentCategory} />}
            <Link
              to={`/buku-penghubung/${childId}`}
              className="btn-secondary btn-sm"
            >
              <BookOpen size={14} /> Buku Penghubung
            </Link>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
          {[
            { label: 'Total Observasi',    value: `${report.total_observations} kali` },
            { label: 'Observasi Terakhir', value: latestObs ? fDateShort(latestObs.date) : '-' },
            { label: 'Tanggal Lahir',      value: fDate(report.child.birth_date) },
            { label: 'Usia Saat Ini',      value: report.child.age ? `${report.child.age.years} thn ${report.child.age.months} bln` : calcAge(report.child.birth_date) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prediction + scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Prediction result */}
        {pred && (
          <div
            className="card p-5 border-l-4"
            style={{ borderColor: talentColor(pred.prediction as TalentCategory) }}
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Hasil Prediksi Bakat & Minat
            </p>
            <div className="flex items-center gap-4">
              <div className="text-5xl">
                {pred.prediction === 'Linguistik'      && '📚'}
                {pred.prediction === 'Seni'            && '🎨'}
                {pred.prediction === 'Kinestetik'      && '⚽'}
                {pred.prediction === 'Butuh Stimulasi' && '🌱'}
              </div>
              <div>
                <h3 className="text-2xl font-black" style={{ color: talentColor(pred.prediction as TalentCategory) }}>
                  {pred.prediction}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Tingkat kepercayaan</p>
                <ConfidenceBar value={pred.confidence} />
              </div>
            </div>

            {/* Probabilities */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              {Object.entries(pred.probabilities).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-32 truncate">{k}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${v}%`, background: talentColor(k as TalentCategory) }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-10 text-right tabular-nums">
                    {(v as number).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest scores */}
        {latestObs && (
          <div className="card p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Skor Observasi Terakhir · {fDate(latestObs.date)}
            </p>
            <div className="space-y-3">
              {ASPECT_KEYS.map((k) => {
                const score = latestObs.scores?.[k] as 1 | 2 | 3 | 4
                const pct   = (score / 4) * 100
                const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500']
                return (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{ASPECT_LABELS[k]}</span>
                      <span className="font-semibold text-slate-600">{score}/4 · {likertLabel(score)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[score]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            {latestObs.note && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-1">Catatan Guru</p>
                <p className="text-sm text-slate-600 italic">"{latestObs.note}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tren perkembangan */}
      {timeline.length > 1 && (
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900">Tren Perkembangan</h3>
            <p className="text-xs text-slate-500 mt-0.5">{timeline.length} observasi dari waktu ke waktu</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={timeline} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={(d) => fDateShort(d)}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                domain={[0, 4]}
                ticks={[1, 2, 3, 4]}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <Tooltip
                labelFormatter={(d) => fDate(d)}
                formatter={(v: number, name: string) => [
                  `${v} — ${likertLabel(v as 1|2|3|4)}`,
                  ASPECT_LABELS[name] ?? name,
                ]}
                contentStyle={{
                  borderRadius: 10, border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12,
                }}
              />
              <Legend
                formatter={(v) => ASPECT_LABELS[v] ?? v}
                wrapperStyle={{ fontSize: 11 }}
              />
              {ASPECT_KEYS.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={ASPECT_COLORS[i]}
                  strokeWidth={2}
                  dot={{ fill: ASPECT_COLORS[i], r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rekomendasi stimulasi */}
      {recs.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900">Rekomendasi Stimulasi di Rumah</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Berdasarkan hasil analisis bakat: {pred?.prediction}
              </p>
            </div>
            <span className="text-2xl">
              {pred?.prediction === 'Linguistik'      && '📚'}
              {pred?.prediction === 'Seni'            && '🎨'}
              {pred?.prediction === 'Kinestetik'      && '⚽'}
              {pred?.prediction === 'Butuh Stimulasi' && '🌱'}
            </span>
          </div>
          <ul className="space-y-3">
            {recs.map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{rec}</p>
              </li>
            ))}
          </ul>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Ingin laporan lengkap? Unduh buku penghubung di bawah.
            </p>
            <Link to={`/buku-penghubung/${childId}`} className="btn-primary btn-sm">
              <BookOpen size={14} /> Buku Penghubung <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
