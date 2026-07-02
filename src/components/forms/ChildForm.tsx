import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useClasses, useCreateChild, useUpdateChild, useUsers } from '@/hooks'
import { Modal } from '@/components/ui'
import type { Child } from '@/types'

const schema = z.object({
  nis: z.string().min(1, 'NIS wajib diisi').max(20),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  birth_date: z.string().min(1, 'Tanggal lahir wajib diisi'),
  gender: z.enum(['L', 'P']),
  class_id: z.string().uuid('Pilih kelas'),
  parent_user_id: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function ChildFormModal({
  child,
  onClose,
}: {
  child?: Child
  onClose: () => void
}) {
  const isEdit = !!child
  const { data: classesData } = useClasses()
  const { data: parentsData } = useUsers({ role: 'orang_tua', limit: 100 })
  const createChild = useCreateChild()
  const updateChild = useUpdateChild()

  const classes = classesData?.data ?? []
  const parents = parentsData?.data ?? []

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: child
      ? {
          nis: child.nis,
          name: child.name,
          birth_date: child.birth_date.split('T')[0],
          gender: child.gender,
          class_id: child.class_id,
          parent_user_id: child.parent_user_id ?? '',
          notes: child.notes ?? '',
        }
      : { gender: 'L', parent_user_id: '' },
  })

  const isPending = createChild.isPending || updateChild.isPending

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      parent_user_id: data.parent_user_id || undefined,
      notes: data.notes || undefined,
    }

    if (isEdit) {
      updateChild.mutate({ id: child!.id, data: payload }, { onSuccess: onClose })
    } else {
      createChild.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Modal open title={isEdit ? 'Edit Siswa' : 'Tambah Siswa'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">NIS</label>
            <input {...register('nis')} className="form-input" placeholder="NIS001" />
            {errors.nis && <p className="form-error">{errors.nis.message}</p>}
          </div>
          <div>
            <label className="form-label">Nama Lengkap</label>
            <input {...register('name')} className="form-input" placeholder="Nama siswa" />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="form-label">Tanggal Lahir</label>
            <input {...register('birth_date')} type="date" className="form-input" />
            {errors.birth_date && <p className="form-error">{errors.birth_date.message}</p>}
          </div>
          <div>
            <label className="form-label">Jenis Kelamin</label>
            <select {...register('gender')} className="form-select">
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          <div>
            <label className="form-label">Kelas</label>
            <select {...register('class_id')} className="form-select">
              <option value="">Pilih kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.class_id && <p className="form-error">{errors.class_id.message}</p>}
          </div>
          <div>
            <label className="form-label">
              Orang Tua <span className="normal-case font-normal text-slate-400">(opsional)</span>
            </label>
            <select {...register('parent_user_id')} className="form-select">
              <option value="">Tidak ada / belum dihubungkan</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">
            Catatan <span className="normal-case font-normal text-slate-400">(opsional)</span>
          </label>
          <textarea {...register('notes')} rows={2} className="form-input resize-none" placeholder="Catatan khusus tentang siswa" />
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={isPending}>
            Batal
          </button>
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending
              ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
              : isEdit ? 'Simpan Perubahan' : 'Tambah Siswa'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
