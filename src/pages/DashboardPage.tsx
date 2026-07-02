import { Users, ClipboardCheck, Clock, Brain, Plus, ArrowRight, BookOpen, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAuthStore } from '@/stores/auth.store'
import {
  useGuruDashboard, useAdminDashboard, useParentDashboard,
  useRecentActivity, usePredictionDistribution, usePredictions,
} from '@/hooks'
import { StatCard, PageLoader, TalentBadge, EmptyState } from '@/components/ui'
import { fTimeAgo, fDateShort, talentColor, cn, fConfidence, toConfidence } from '@/utils'
import type { TalentCategory, Prediction, DashboardOverview } from '@/types'

function normalizeOverview(raw?: DashboardOverview | null) {
  if (!raw) {
    return {
      total_classes: 0,
      total_students: 0,
      observed_students: 0,
      unobserved_students: 0,
      total_observations: 0,
      observed_percentage: 0,
    }
  }

  const totalStudents = Number(raw.total_students ?? raw.total_children ?? 0)
  const observedStudents = Number(raw.observed_students ?? 0)
  const unobservedStudents = Number(
    raw.unobserved_students ?? Math.max(totalStudents - observedStudents, 0),
  )

  return {
    total_classes: Number(raw.total_classes ?? 0),
    total_students: totalStudents,
    observed_students: observedStudents,
    unobserved_students: unobservedStudents,
    total_observations: Number(raw.total_observations ?? 0),
    observed_percentage: Number(raw.observed_percentage ?? 0),
  }
}

type DistChartItem = { name: string; value: number; pct: number; color: string }

function buildTalentDistChartData(
  distribution?: Array<{ label: string; count: number; percentage: number }>,
  talentDist?: Array<{ prediction: string; count: number | string }>,
): DistChartItem[] {
  const fromApi = (distribution ?? []).filter((d) => d.count > 0)
  if (fromApi.length > 0) {
    return fromApi.map((d) => ({
      name: d.label,
      value: d.count,
      pct: d.percentage,
      color: talentColor(d.label as TalentCategory),
    }))
  }

  const rows = (talentDist ?? [])
    .map((d) => ({ label: d.prediction, count: Number(d.count) }))
    .filter((d) => d.count > 0)

  const total = rows.reduce((sum, d) => sum + d.count, 0)
  return rows.map((d) => ({
    name: d.label,
    value: d.count,
    pct: total > 0 ? Math.round((d.count / total) * 100 * 10) / 10 : 0,
    color: talentColor(d.label as TalentCategory),
  }))
}

const ACTION_LABELS: Record<string, string> = {
  CREATE_OBSERVATION: 'menambahkan observasi',
  UPDATE_OBSERVATION: 'memperbarui observasi',
  PREDICT:            'menjalankan prediksi',
  RETRAIN_MODEL:      'melatih ulang model',
  CREATE_CHILD:       'menambahkan siswa',
  UPDATE_CHILD:       'memperbarui data siswa',
  LOGIN:              'login ke sistem',
  DELETE_OBSERVATION: 'menghapus observasi',
}

const DOT_COLORS: Record<string, string> = {
  CREATE_OBSERVATION: 'bg-emerald-400',
  PREDICT:            'bg-blue-400',
  RETRAIN_MODEL:      'bg-red-400',
  CREATE_CHILD:       'bg-amber-400',
  UPDATE_CHILD:       'bg-violet-400',
  LOGIN:              'bg-slate-400',
}

interface ParentChildSummary {
  id: string
  name: string
  nis: string
  class?: { id: string; name: string }
  latest_prediction: TalentCategory | null
  latest_confidence: number | null
  last_observed: string | null
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  if (user?.role === 'orang_tua') {
    return <ParentDashboard />
  }

  return <StaffDashboard isAdmin={user?.role === 'admin'} />
}

function ParentDashboard() {
  const { user } = useAuthStore()
  const { data, isLoading } = useParentDashboard()
  const children: ParentChildSummary[] = data?.children ?? []

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-600/20">
        <p className="text-emerald-100 text-sm">Selamat datang,</p>
        <h2 className="text-2xl font-bold mt-0.5">{user?.name} 👋</h2>
        <p className="text-emerald-200 text-sm mt-1">
          {children.length > 0
            ? `Pantau perkembangan ${children.length} anak Anda`
            : 'Akun belum terhubung ke data siswa'}
        </p>
      </div>

      {children.length === 0 ? (
        <EmptyState
          title="Belum ada data anak"
          description="Hubungi guru atau administrator untuk menghubungkan akun Anda ke data siswa."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((child) => (
            <div key={child.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900">{child.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {child.class?.name ?? 'Kelas'} · NIS {child.nis}
                  </p>
                </div>
                {child.latest_prediction
                  ? <TalentBadge category={child.latest_prediction} />
                  : <span className="badge-slate">Belum diobservasi</span>}
              </div>
              {child.last_observed && (
                <p className="text-xs text-slate-500 mb-4">
                  Observasi terakhir: {fDateShort(child.last_observed)}
                  {child.latest_confidence != null && ` · ${fConfidence(child.latest_confidence, 0)}% kepercayaan`}
                </p>
              )}
              <div className="flex gap-2">
                <Link to="/perkembangan" className="btn-secondary btn-sm flex-1 justify-center">
                  <TrendingUp size={14} /> Perkembangan
                </Link>
                <Link to={`/buku-penghubung/${child.id}`} className="btn-primary btn-sm flex-1 justify-center">
                  <BookOpen size={14} /> Buku Penghubung
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StaffDashboard({ isAdmin }: { isAdmin: boolean }) {
  const { user } = useAuthStore()
  const guru = useGuruDashboard()
  const admin = useAdminDashboard()
  const stats = isAdmin ? admin.data : guru.data
  const isLoading = isAdmin ? admin.isLoading : guru.isLoading

  const { data: activity = [] } = useRecentActivity(8)
  const { data: dist } = usePredictionDistribution()

  if (isLoading) return <PageLoader />

  const ov = normalizeOverview(stats?.overview)
  const model = stats?.active_model
  const distChartData = buildTalentDistChartData(dist?.distribution, stats?.talent_distribution)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Selamat datang kembali,</p>
            <h2 className="text-2xl font-bold mt-0.5">{user?.name} 👋</h2>
            <p className="text-blue-200 text-sm mt-1">
              {ov.unobserved_students > 0
                ? `${ov.unobserved_students} siswa belum diobservasi bulan ini`
                : 'Semua siswa sudah diobservasi ✓'}
            </p>
          </div>
          <Link to="/observasi/baru" className="btn bg-white/20 text-white border border-white/30 hover:bg-white/30 no-print">
            <Plus size={16} />
            Observasi Baru
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Siswa"
          value={ov.total_students}
          subtitle={`${ov.total_classes} kelas aktif`}
          icon={<Users size={22} />}
          accent="border-blue-500"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          delay={0}
        />
        <StatCard
          label="Sudah Diobservasi"
          value={ov.observed_students}
          subtitle={`${ov.observed_percentage}% dari total`}
          icon={<ClipboardCheck size={22} />}
          accent="border-emerald-500"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ value: ov.total_observations, label: 'observasi total' }}
          delay={80}
        />
        <StatCard
          label="Belum Diproses"
          value={ov.unobserved_students}
          subtitle="Perlu observasi"
          icon={<Clock size={22} />}
          accent="border-amber-500"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          delay={160}
        />
        <StatCard
          label="Akurasi Model CART"
          value={model ? `${(model.accuracy * 100).toFixed(1)}%` : 'N/A'}
          subtitle={model ? `Versi ${model.version}` : 'Belum ada model'}
          icon={<Brain size={22} />}
          accent="border-violet-500"
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          delay={240}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900">Distribusi Bakat & Minat</h3>
              <p className="text-xs text-slate-500 mt-0.5">Berdasarkan prediksi CART terbaru</p>
            </div>
            <Link to="/hasil-cart" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Lihat detail <ArrowRight size={12} />
            </Link>
          </div>
          {distChartData.length > 0 ? (
            <div className="flex gap-4 items-center">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={distChartData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {distChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, _: string, props: { payload?: { pct: number } }) =>
                      [`${v} siswa (${props.payload?.pct ?? 0}%)`, '']}
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {distChartData.map((d) => (
                  <div key={d.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: d.color }} />
                        {d.name}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{d.value} <span className="text-slate-400 font-normal">({d.pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: d.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title="Belum ada data prediksi" description="Tambahkan observasi siswa untuk melihat distribusi bakat" />
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Aktivitas Terbaru</h3>
          </div>
          <div className="space-y-3">
            {(activity as Array<{ user?: { name: string }; action: string; created_at: string }>).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Belum ada aktivitas</p>
            ) : (
              activity.slice(0, 7).map((log: { user?: { name: string }; action: string; created_at: string }, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', DOT_COLORS[log.action] ?? 'bg-slate-400')} />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700 leading-snug">
                      <span className="font-semibold">{log.user?.name ?? 'Sistem'}</span>
                      {' '}{ACTION_LABELS[log.action] ?? log.action}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{fTimeAgo(log.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Siswa Terbaru</h3>
            <p className="text-xs text-slate-500 mt-0.5">Hasil prediksi terkini</p>
          </div>
          <Link to="/siswa" className="btn-secondary btn-sm">
            Lihat Semua <ArrowRight size={13} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <QuickStudentTable />
        </div>
      </div>
    </div>
  )
}

function QuickStudentTable() {
  const { data, isLoading } = usePredictions({ page: 1, limit: 5 })
  const predictions = (data?.data ?? []) as Prediction[]

  if (isLoading) {
    return <div className="p-8 text-center"><span className="text-sm text-slate-400">Memuat...</span></div>
  }

  if (predictions.length === 0) {
    return (
      <EmptyState
        title="Belum ada prediksi"
        description="Buat observasi siswa untuk melihat hasil prediksi CART"
      />
    )
  }

  return (
    <table className="table-base">
      <thead>
        <tr>
          <th>Nama Siswa</th>
          <th>Kelas</th>
          <th>Bakat & Minat</th>
          <th>Kepercayaan</th>
          <th>Tgl. Observasi</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {predictions.map((pred, i) => {
          const child = pred.child as Prediction['child'] & { class?: { name: string } }
          const obsDate = pred.observation?.observation_date ?? pred.created_at
          return (
            <tr key={pred.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <td className="font-semibold text-slate-900">{child?.name ?? '-'}</td>
              <td><span className="badge-slate">{child?.class?.name ?? '-'}</span></td>
              <td><TalentBadge category={pred.prediction} /></td>
              <td>
                <div className="flex items-center gap-2 max-w-[120px]">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${toConfidence(pred.confidence)}%`, background: talentColor(pred.prediction) }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 tabular-nums">{fConfidence(pred.confidence, 0)}%</span>
                </div>
              </td>
              <td className="text-slate-500">{fDateShort(obsDate)}</td>
              <td>
                {child?.id && (
                  <Link to={`/siswa/${child.id}`} className="btn-ghost btn-sm text-blue-600 hover:text-blue-700">
                    Detail
                  </Link>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
