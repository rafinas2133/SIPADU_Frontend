import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Brain, Loader2, Save } from 'lucide-react'
import { useCreateObservation, useChildren } from '@/hooks'
import { cn } from '@/utils'
import type { LikertScore, ObservationStatus, Observation } from '@/types'

// ── Schema ────────────────────────────────────────────────────────────────────
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
export type ObservationFormData = z.infer<typeof schema>

// ── Aspect config ─────────────────────────────────────────────────────────────
const ASPECTS = [
  {
    key: 'bahasa' as const,
    label: 'Bahasa',
    desc: 'Kemampuan komunikasi verbal & non-verbal',
    icon: '💬',
  },
  {
    key: 'motorik_halus' as const,
    label: 'Motorik Halus',
    desc: 'Koordinasi tangan, jari, dan mata',
    icon: '✏️',
  },
  {
    key: 'motorik_kasar' as const,
    label: 'Motorik Kasar',
    desc: 'Kemampuan gerak tubuh besar',
    icon: '🏃',
  },
  {
    key: 'kognitif' as const,
    label: 'Kognitif',
    desc: 'Kemampuan berpikir dan memecahkan masalah',
    icon: '🧠',
  },
  {
    key: 'sosial_emosional' as const,
    label: 'Sosial Emosional',
    desc: 'Interaksi sosial dan regulasi perasaan',
    icon: '🤝',
  },
]

const LIKERT_OPTIONS = [
  {
    val: 1 as LikertScore,
    short: 'BB',
    label: 'Belum Berkembang',
    baseClass: 'border-red-200 text-red-600 bg-red-50 hover:border-red-400 hover:bg-red-50',
    selClass: 'border-red-500 bg-red-500 text-white shadow-sm',
  },
  {
    val: 2 as LikertScore,
    short: 'MB',
    label: 'Mulai Berkembang',
    baseClass: 'border-amber-200 text-amber-600 bg-amber-50 hover:border-amber-400',
    selClass: 'border-amber-500 bg-amber-500 text-white shadow-sm',
  },
  {
    val: 3 as LikertScore,
    short: 'BSH',
    label: 'Sesuai Harapan',
    baseClass: 'border-blue-200 text-blue-600 bg-blue-50 hover:border-blue-400',
    selClass: 'border-blue-500 bg-blue-500 text-white shadow-sm',
  },
  {
    val: 4 as LikertScore,
    short: 'BSB',
    label: 'Sangat Baik',
    baseClass: 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:border-emerald-400',
    selClass: 'border-emerald-500 bg-emerald-500 text-white shadow-sm',
  },
]

// ── Likert selector ───────────────────────────────────────────────────────────
function LikertSelector({
  value,
  onChange,
}: {
  value?: LikertScore
  onChange: (v: LikertScore) => void
}) {
  return (
    <div className="flex gap-2 mt-2">
      {LIKERT_OPTIONS.map(({ val, short, label, baseClass, selClass }) => (
        <button
          key={val}
          type="button"
          title={`${val} — ${label}`}
          onClick={() => onChange(val)}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 py-3 px-1 rounded-xl border-2 text-xs font-bold transition-all duration-150 select-none',
            value === val ? selClass : baseClass
          )}
        >
          <span className="text-base leading-none font-black">{val}</span>
          <span className="text-[9px] font-semibold opacity-80 leading-none">{short}</span>
        </button>
      ))}
    </div>
  )
}

// ── Main form component ───────────────────────────────────────────────────────
interface ObservationFormProps {
  defaultChildId?: string
  onSuccess?: (obs: Observation) => void
  compact?: boolean
}

export function ObservationForm({ defaultChildId, onSuccess, compact = false }: ObservationFormProps) {
  const { data: childData } = useChildren({ limit: 100 })
  const children = childData?.data ?? []
  const create = useCreateObservation()

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ObservationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      child_id:         defaultChildId ?? '',
      observation_date: new Date().toISOString().slice(0, 10),
      status:           'final',
    },
  })

  const onSubmit = (data: ObservationFormData) => {
    create.mutate(data, {
      onSuccess: (res) => {
        onSuccess?.(res.data.data)
        reset({
          child_id:         defaultChildId ?? '',
          observation_date: new Date().toISOString().slice(0, 10),
          status:           'final',
        })
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Siswa + Tanggal */}
      <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'grid-cols-2')}>
        {!defaultChildId && (
          <div>
            <label className="form-label">Siswa</label>
            <select {...register('child_id')} className="form-select">
              <option value="">Pilih siswa</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.class?.name ?? '-'})
                </option>
              ))}
            </select>
            {errors.child_id && <p className="form-error">{errors.child_id.message}</p>}
          </div>
        )}
        <div>
          <label className="form-label">Tanggal Observasi</label>
          <input
            {...register('observation_date')}
            type="date"
            className="form-input"
          />
          {errors.observation_date && (
            <p className="form-error">{errors.observation_date.message}</p>
          )}
        </div>
      </div>

      {/* Likert aspects */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Penilaian Aspek Perkembangan
        </p>

        {/* Legend */}
        <div className="flex gap-2 flex-wrap text-[10px] text-slate-500">
          {LIKERT_OPTIONS.map(({ short, label, val }) => (
            <span key={val} className="flex items-center gap-1">
              <strong>{val}={short}</strong> {label}
            </span>
          ))}
        </div>

        {ASPECTS.map(({ key, label, desc, icon }) => (
          <div key={key} className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 leading-tight">{label}</p>
                {!compact && (
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                )}
              </div>
            </div>
            <Controller
              name={key}
              control={control}
              render={({ field }) => (
                <LikertSelector value={field.value} onChange={field.onChange} />
              )}
            />
            {errors[key] && (
              <p className="form-error mt-1">Pilih nilai untuk {label}</p>
            )}
          </div>
        ))}
      </div>

      {/* Catatan */}
      <div>
        <label className="form-label">
          Catatan Anekdot{' '}
          <span className="normal-case font-normal text-slate-400">(opsional)</span>
        </label>
        <textarea
          {...register('note')}
          rows={compact ? 2 : 3}
          placeholder="Pengamatan khusus, peristiwa menarik, atau catatan tambahan..."
          className="form-input resize-none"
        />
      </div>

      {/* Action row */}
      <div className="flex items-center gap-3">
        <select {...register('status')} className="form-select w-44">
          <option value="final">Simpan & Prediksi</option>
          <option value="draft">Simpan sebagai Draft</option>
        </select>

        <button type="submit" disabled={create.isPending} className="btn-primary flex-1 justify-center">
          {create.isPending ? (
            <><Loader2 size={15} className="animate-spin" /> Memproses...</>
          ) : (
            <><Brain size={15} /> Simpan & Prediksi</>
          )}
        </button>
      </div>
    </form>
  )
}
