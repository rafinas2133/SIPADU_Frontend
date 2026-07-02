import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, User, ClipboardList, Brain, BookOpen, Printer } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend,
} from 'recharts'
import { useChild, useChildReport } from '@/hooks'
import { PageLoader, TalentBadge, ConfidenceBar, LikertDisplay, SectionHeader } from '@/components/ui'
import { fDate, fDateShort, calcAge, genderLabel, likertLabel, talentColor, cn } from '@/utils'
import type { TalentCategory, LikertScore } from '@/types'

const ASPECT_LABELS: Record<string, string> = {
  bahasa: 'Bahasa', motorik_halus: 'Motorik Halus',
  motorik_kasar: 'Motorik Kasar', kognitif: 'Kognitif',
  sosial_emosional: 'Sos. Emosional',
}
const ASPECT_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
const ASPECT_KEYS   = ['bahasa', 'motorik_halus', 'motorik_kasar', 'kognitif', 'sosial_emosional']

export default function ProfilSiswaPage() {
  const { id } = useParams<{ id: string }>()
  const { data: child, isLoading: childLoading } = useChild(id!)
  const { data: report, isLoading: reportLoading } = useChildReport(id!)

  if (childLoading || reportLoading) return <PageLoader />
  if (!child) return <div className="p-8 text-center text-slate-500">Siswa tidak ditemukan</div>

  const latestPred = report?.latest_prediction
  const timeline   = report?.progress_timeline ?? []
  const avgScores  = report?.average_scores ?? {}
  const recs       = report?.recommendations ?? []

  // Radar data untuk rata-rata skor
  const radarData = ASPECT_KEYS.map((k) => ({
    subject: ASPECT_LABELS[k],
    value: avgScores[k] ?? 0,
    fullMark: 4,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back nav */}
      <Link to="/siswa" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={15} /> Kembali ke Data Siswa
      </Link>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center text-blue-700 font-black text-2xl flex-shrink-0 shadow-sm">
              {child.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">{child.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-slate-500">
                <span className="flex items-center gap-1"><User size={13} /> NIS {child.nis}</span>
                <span>{genderLabel(child.gender)}</span>
                <span>{calcAge(child.birth_date)}</span>
                {child.class && <span className="badge-blue">{child.class.name}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {latestPred && <TalentBadge category={latestPred.prediction as TalentCategory} />}
            <Link
              to={`/buku-penghubung/${child.id}`}
              className="btn-secondary btn-sm"
            >
              <Printer size={14} /> Buku Penghubung
            </Link>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
          {[
            { label: 'Tanggal Lahir',      value: fDate(child.birth_date) },
            { label: 'Kelas',              value: child.class?.name ?? '-' },
            { label: 'Total Observasi',    value: `${report?.total_observations ?? 0} kali` },
            { label: 'Tgl. Observasi Terakhir', value: report?.latest_observation ? fDateShort(report.latest_observation.date) : '-' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prediction + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prediction result */}
        {latestPred && (
          <div className="card p-5 border-l-4" style={{ borderColor: talentColor(latestPred.prediction as TalentCategory) }}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Hasil Prediksi Terbaru</p>
            <div className="text-center py-4">
              <div className="text-4xl mb-2">
                {latestPred.prediction === 'Linguistik' && '📚'}
                {latestPred.prediction === 'Seni' && '🎨'}
                {latestPred.prediction === 'Kinestetik' && '⚽'}
                {latestPred.prediction === 'Butuh Stimulasi' && '🌱'}
              </div>
              <h2 className="text-xl font-black" style={{ color: talentColor(latestPred.prediction as TalentCategory) }}>
                {latestPred.prediction}
              </h2>
            </div>
            <ConfidenceBar value={latestPred.confidence} />
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Versi model: {latestPred.model_version}
            </p>

            {/* Probabilities */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              {Object.entries(latestPred.probabilities).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-28 truncate">{k}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${v}%`, background: talentColor(k as TalentCategory) }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 w-9 text-right">{(v as number).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Radar chart */}
        <div className={cn('card p-5', latestPred ? 'lg:col-span-2' : 'lg:col-span-3')}>
          <SectionHeader title="Profil Perkembangan" subtitle="Rata-rata skor per aspek (semua observasi)" />
          {radarData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Radar name={child.name} dataKey="value" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} dot={{ fill: '#2563EB', r: 4 }} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(2)} / 4`, 'Skor']} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Belum ada data observasi</div>
          )}
        </div>
      </div>

      {/* Progress timeline chart */}
      {timeline.length > 1 && (
        <div className="card p-5">
          <SectionHeader title="Tren Perkembangan" subtitle={`${timeline.length} observasi terakhir`} />
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timeline} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis dataKey="date" tickFormatter={(d) => fDateShort(d)} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[0, 4]} ticks={[1, 2, 3, 4]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                labelFormatter={(d) => fDate(d)}
                formatter={(v: number, name: string) => [likertLabel(v as 1|2|3|4), ASPECT_LABELS[name] ?? name]}
                contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12 }}
              />
              <Legend formatter={(v) => ASPECT_LABELS[v] ?? v} wrapperStyle={{ fontSize: 11 }} />
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

      {/* Observation history + latest scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest scores detail */}
        {report?.latest_observation && (
          <div className="card p-5">
            <SectionHeader title="Skor Observasi Terakhir" subtitle={fDate(report.latest_observation.date)} />
            <div className="space-y-3">
              {ASPECT_KEYS.map((k) => (
                <div key={k} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-600 font-medium">{ASPECT_LABELS[k]}</span>
                  <LikertDisplay
                    score={report.latest_observation!.scores![k] as LikertScore}
                    label={likertLabel(report.latest_observation!.scores![k] as LikertScore)}
                  />
                </div>
              ))}
            </div>
            {report.latest_observation.note && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-1">Catatan Guru</p>
                <p className="text-sm text-slate-600 italic">"{report.latest_observation.note}"</p>
              </div>
            )}
          </div>
        )}

        {/* Stimulation recommendations */}
        {recs.length > 0 && (
          <div className="card p-5">
            <SectionHeader
              title="Rekomendasi Stimulasi"
              subtitle={latestPred?.prediction ? `Untuk ${latestPred.prediction}` : 'Berdasarkan hasil prediksi terbaru'}
            />
            <ul className="space-y-2.5">
              {recs.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Observation history table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Riwayat Observasi</h3>
        </div>
        {timeline.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Belum ada riwayat observasi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Bahasa</th>
                  <th>Motorik H.</th>
                  <th>Motorik K.</th>
                  <th>Kognitif</th>
                  <th>Sos. Emosi</th>
                  <th>Prediksi</th>
                </tr>
              </thead>
              <tbody>
                {[...timeline].reverse().map((t: any, i: number) => (
                  <tr key={i}>
                    <td className="text-slate-600 font-medium">{fDateShort(t.date)}</td>
                    {ASPECT_KEYS.map((k) => (
                      <td key={k}>
                        <ScoreBadge score={t[k]} />
                      </td>
                    ))}
                    <td>
                      {t.prediction
                        ? <TalentBadge category={t.prediction as TalentCategory} showEmoji={false} />
                        : <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const cls = ['','bg-red-100 text-red-700','bg-amber-100 text-amber-700','bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700']
  const lbl = ['','BB','MB','BSH','BSB']
  return (
    <span className={cn('inline-flex items-center justify-center w-9 h-6 rounded text-xs font-bold', cls[score] ?? 'bg-slate-100')}>
      {lbl[score] ?? score}
    </span>
  )
}
