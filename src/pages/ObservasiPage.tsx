import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Brain, CheckCircle, ClipboardList, ArrowRight } from 'lucide-react'
import { useChildren, useCreateObservation, useObservations, useClasses } from '@/hooks'
import { TalentBadge, ConfidenceBar, EmptyState, PageLoader, Pagination } from '@/components/ui'
import { fDateShort, talentColor, talentEmoji, cn, fConfidence, toConfidence } from '@/utils'
import type { LikertScore, TalentCategory, Observation } from '@/types'

// ── Likert score schema ───────────────────────────────────────────────────────
const schema = z.object({
  child_id:         z.string().uuid('Pilih siswa terlebih dahulu'),
  observation_date: z.string().min(1, 'Tanggal wajib diisi'),
  bahasa:           z.number().int().min(1).max(4) as z.ZodType<LikertScore>,
  motorik_halus:    z.number().int().min(1).max(4) as z.ZodType<LikertScore>,
  motorik_kasar:    z.number().int().min(1).max(4) as z.ZodType<LikertScore>,
  kognitif:         z.number().int().min(1).max(4) as z.ZodType<LikertScore>,
  sosial_emosional: z.number().int().min(1).max(4) as z.ZodType<LikertScore>,
  note:             z.string().optional(),
  status:           z.enum(['draft', 'final']),
})
type FormData = z.infer<typeof schema>

const ASPECTS = [
  { key: 'bahasa' as const,           label: 'Bahasa',           desc: 'Kemampuan komunikasi verbal & non-verbal' },
  { key: 'motorik_halus' as const,    label: 'Motorik Halus',    desc: 'Koordinasi tangan, jari, dan mata' },
  { key: 'motorik_kasar' as const,    label: 'Motorik Kasar',    desc: 'Kemampuan gerak tubuh besar' },
  { key: 'kognitif' as const,         label: 'Kognitif',         desc: 'Kemampuan berpikir dan memecahkan masalah' },
  { key: 'sosial_emosional' as const, label: 'Sosial Emosional', desc: 'Interaksi sosial dan regulasi perasaan' },
]

const LIKERT = [
  { val: 1 as LikertScore, label: 'Belum Berkembang',        short: 'BB', color: 'border-red-300 text-red-600 bg-red-50',       selColor: 'border-red-500 bg-red-500 text-white' },
  { val: 2 as LikertScore, label: 'Mulai Berkembang',         short: 'MB', color: 'border-amber-300 text-amber-600 bg-amber-50',  selColor: 'border-amber-500 bg-amber-500 text-white' },
  { val: 3 as LikertScore, label: 'Berkembang Sesuai Harapan',short: 'BSH',color: 'border-blue-300 text-blue-600 bg-blue-50',    selColor: 'border-blue-500 bg-blue-500 text-white' },
  { val: 4 as LikertScore, label: 'Berkembang Sangat Baik',   short: 'BSB',color: 'border-emerald-300 text-emerald-600 bg-emerald-50', selColor: 'border-emerald-500 bg-emerald-500 text-white' },
]

// ── Likert selector component ─────────────────────────────────────────────────
function LikertSelector({ value, onChange }: { value?: LikertScore; onChange: (v: LikertScore) => void }) {
  return (
    <div className="flex gap-2 mt-2">
      {LIKERT.map(({ val, short, label, color, selColor }) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          className={cn(
            'flex-1 flex flex-col items-center gap-1 py-3 px-1 rounded-xl border-2 text-xs font-bold transition-all',
            value === val ? selColor : color
          )}
          title={label}
        >
          <span className="text-base font-black">{val}</span>
          <span className="text-[9px] font-semibold opacity-80">{short}</span>
        </button>
      ))}
    </div>
  )
}

export default function ObservasiPage() {
  const [page, setPage] = useState(1)
  const [predResult, setPredResult] = useState<Observation | null>(null)
  const { data: childData } = useChildren({ limit: 100 })
  const { data: obsData, isLoading } = useObservations({ page, limit: 10 })
  const create = useCreateObservation()

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      observation_date: new Date().toISOString().slice(0, 10),
      status: 'final',
    },
  })

  const onSubmit = (data: FormData) => {
    create.mutate(data, {
      onSuccess: (res) => {
        setPredResult(res.data.data)
        reset({ observation_date: new Date().toISOString().slice(0, 10), status: 'final' })
      },
    })
  }

  const observations = obsData?.data ?? []
  const meta = obsData?.meta
  const children = childData?.data ?? []

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Observasi Siswa</h1>
        <p className="page-subtitle">Isi form observasi dan sistem akan otomatis memprediksi bakat anak</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 card p-6">
          <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <ClipboardList size={18} className="text-blue-500" />
            Form Observasi Baru
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Siswa + Tanggal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Siswa</label>
                <select {...register('child_id')} className="form-select">
                  <option value="">Pilih siswa</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.class?.name})</option>
                  ))}
                </select>
                {errors.child_id && <p className="form-error">{errors.child_id.message}</p>}
              </div>
              <div>
                <label className="form-label">Tanggal Observasi</label>
                <input {...register('observation_date')} type="date" className="form-input" />
                {errors.observation_date && <p className="form-error">{errors.observation_date.message}</p>}
              </div>
            </div>

            {/* Aspek penilaian */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Penilaian Aspek Perkembangan</p>
              {ASPECTS.map(({ key, label, desc }) => (
                <div key={key} className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </div>
                  <Controller
                    name={key}
                    control={control}
                    render={({ field }) => (
                      <LikertSelector value={field.value} onChange={field.onChange} />
                    )}
                  />
                  {errors[key] && <p className="form-error mt-1">Pilih nilai untuk {label}</p>}
                </div>
              ))}
            </div>

            {/* Catatan */}
            <div>
              <label className="form-label">Catatan Anekdot <span className="normal-case font-normal text-slate-400">(opsional)</span></label>
              <textarea
                {...register('note')}
                rows={3}
                placeholder="Tuliskan pengamatan tambahan, kejadian menarik, atau catatan khusus..."
                className="form-input resize-none"
              />
            </div>

            {/* Status + Submit */}
            <div className="flex items-center gap-3 pt-1">
              <select {...register('status')} className="form-select w-36">
                <option value="final">Simpan & Prediksi</option>
                <option value="draft">Simpan sebagai Draft</option>
              </select>
              <button type="submit" disabled={create.isPending} className="btn-primary flex-1 justify-center">
                {create.isPending
                  ? <><Loader2 size={16} className="animate-spin" /> Memproses...</>
                  : <><Brain size={16} /> Simpan & Prediksi</>}
              </button>
            </div>
          </form>
        </div>

        {/* Result panel */}
        <div className="lg:col-span-2 space-y-4">
          {predResult?.prediction ? (
            <PredictionResultCard prediction={predResult.prediction} />
          ) : (
            <div className="card p-6 flex flex-col items-center justify-center text-center min-h-64">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-3 text-2xl">🧠</div>
              <h3 className="font-semibold text-slate-800">Hasil Prediksi CART</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Isi form observasi dan klik "Simpan & Prediksi" untuk melihat hasil analisis
              </p>
            </div>
          )}

          {/* Previous observations panel */}
          <div className="card p-4">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Observasi Terakhir</h3>
            {isLoading ? (
              <p className="text-xs text-slate-400">Memuat...</p>
            ) : observations.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada observasi</p>
            ) : (
              <div className="space-y-2">
                {observations.slice(0, 4).map((obs) => (
                  <div key={obs.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{obs.child?.name}</p>
                      <p className="text-[10px] text-slate-400">{fDateShort(obs.observation_date)}</p>
                    </div>
                    {obs.prediction ? (
                      <TalentBadge category={obs.prediction.prediction} showEmoji={false} />
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Draft</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Observation history table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Riwayat Observasi</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 size={20} className="animate-spin text-blue-500 mx-auto" /></div>
        ) : observations.length === 0 ? (
          <EmptyState title="Belum ada observasi" description="Buat observasi pertama menggunakan form di atas" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Siswa</th>
                  <th>Tanggal</th>
                  <th>Bahasa</th>
                  <th>Motorik H.</th>
                  <th>Motorik K.</th>
                  <th>Kognitif</th>
                  <th>Sos. Emosi</th>
                  <th>Hasil</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {observations.map((obs) => (
                  <tr key={obs.id}>
                    <td className="font-medium text-slate-900">{obs.child?.name ?? '-'}</td>
                    <td className="text-slate-500">{fDateShort(obs.observation_date)}</td>
                    {(['bahasa','motorik_halus','motorik_kasar','kognitif','sosial_emosional'] as const).map((k) => (
                      <td key={k}>
                        <ScorePill score={obs[k]} />
                      </td>
                    ))}
                    <td>
                      {obs.prediction
                        ? <TalentBadge category={obs.prediction.prediction} showEmoji={false} />
                        : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td>
                      <span className={cn('badge text-[10px]', obs.status === 'final' ? 'badge-green' : 'badge-amber')}>
                        {obs.status === 'final' ? 'Final' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta && (
          <div className="px-5 pb-4">
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}

// Score pill
function ScorePill({ score }: { score: number }) {
  const styles = ['', 'bg-red-100 text-red-700', 'bg-amber-100 text-amber-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700']
  return (
    <span className={cn('inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold', styles[score])}>
      {score}
    </span>
  )
}

// Prediction result card
function PredictionResultCard({ prediction }: { prediction: Observation['prediction'] }) {
  if (!prediction) return null
  const cat = prediction.prediction as TalentCategory
  const emoji = talentEmoji(cat)
  const color = talentColor(cat)

  return (
    <div className="card p-5 border-2 animate-fade-in" style={{ borderColor: color + '40' }}>
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle size={18} className="text-emerald-500" />
        <span className="text-sm font-semibold text-slate-700">Hasil Prediksi CART</span>
      </div>

      <div className="text-center py-3">
        <div className="text-4xl mb-2">{emoji}</div>
        <h3 className="text-xl font-black" style={{ color }}>{cat}</h3>
        <p className="text-sm text-slate-500 mt-1">Kepercayaan model: <strong>{fConfidence(prediction.confidence, 1)}%</strong></p>
      </div>

      <div className="space-y-2 mt-4">
        {Object.entries(prediction.probabilities).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <span className="text-xs text-slate-600 w-32 truncate">{k}</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${toConfidence(v)}%`, background: talentColor(k as TalentCategory) }} />
            </div>
            <span className="text-xs font-semibold text-slate-700 tabular-nums w-10 text-right">{fConfidence(v, 1)}%</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 bg-emerald-50 rounded-xl p-3">
        <p className="text-xs font-semibold text-emerald-700 mb-1">Rekomendasi Stimulasi</p>
        <p className="text-xs text-emerald-600">
          {cat === 'Linguistik' && 'Perbanyak kegiatan membaca, bercerita, dan diskusi kelompok.'}
          {cat === 'Seni' && 'Sediakan alat menggambar, musik, dan kegiatan kerajinan tangan.'}
          {cat === 'Kinestetik' && 'Berikan waktu bermain fisik aktif, olahraga, dan eksplorasi gerak.'}
          {cat === 'Butuh Stimulasi' && 'Berikan perhatian ekstra dan jadwal belajar terstruktur. Konsultasi dengan ahli.'}
        </p>
      </div>
    </div>
  )
}
