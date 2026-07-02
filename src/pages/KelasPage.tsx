import { useState } from 'react'
import { Plus, Pencil, Trash2, Users, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useClasses, useCreateClass, useUpdateClass, useDeleteClass, useUsers,
} from '@/hooks'
import { PageLoader, EmptyState, ConfirmDialog, Modal, SectionHeader } from '@/components/ui'
import { fDate } from '@/utils'
import type { Class } from '@/types'

const classSchema = z.object({
  name:          z.string().min(1, 'Nama kelas wajib diisi').max(50),
  teacher_id:    z.string().uuid('Pilih guru yang mengajar'),
  academic_year: z.string().regex(/^\d{4}\/\d{4}$/, 'Format: 2025/2026'),
  description:   z.string().optional(),
})
type ClassForm = z.infer<typeof classSchema>

export default function KelasPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [editClass, setEditClass] = useState<Class | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useClasses()
  const deleteClass = useDeleteClass()

  const classes: Class[] = data?.data ?? []
  const total = data?.meta?.total ?? classes.length

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Kelola Kelas</h1>
          <p className="page-subtitle">{total} kelas aktif</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={15} /> Buat Kelas Baru
        </button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : classes.length === 0 ? (
        <EmptyState
          title="Belum ada kelas"
          description="Buat kelas pertama dan assign guru untuk mulai"
          action={
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus size={15} /> Buat Kelas
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((kelas, i) => (
            <div
              key={kelas.id}
              className="card p-5 hover:shadow-card-hover transition-shadow animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-black text-lg flex-shrink-0">
                    {kelas.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{kelas.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{kelas.academic_year}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditClass(kelas)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(kelas.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="text-slate-400 text-xs w-16">Guru</span>
                  <span className="font-medium">{kelas.teacher?.name ?? '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="text-slate-400 text-xs w-16">Siswa</span>
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-slate-400" />
                    <span className="font-medium">{kelas.student_count ?? 0} siswa</span>
                  </div>
                </div>
                {kelas.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{kelas.description}</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] text-slate-400">
                  Dibuat {fDate(kelas.created_at)}
                </p>
                <Link
                  to={`/siswa?class_id=${kelas.id}`}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                >
                  Lihat siswa <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <ClassFormModal onClose={() => setShowAdd(false)} />}
      {editClass && <ClassFormModal kelas={editClass} onClose={() => setEditClass(null)} />}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteClass.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
          }
        }}
        title="Hapus Kelas"
        message="Kelas hanya dapat dihapus jika tidak ada siswa yang terdaftar. Pastikan semua siswa sudah dipindahkan terlebih dahulu."
        confirmLabel="Hapus Kelas"
        loading={deleteClass.isPending}
      />
    </div>
  )
}

function ClassFormModal({ kelas, onClose }: { kelas?: Class; onClose: () => void }) {
  const isEdit = !!kelas
  const { data: guruData } = useUsers({ role: 'guru', limit: 100 })
  const createClass = useCreateClass()
  const updateClass = useUpdateClass()
  const guruList = guruData?.data ?? []

  const { register, handleSubmit, formState: { errors } } = useForm<ClassForm>({
    resolver: zodResolver(classSchema),
    defaultValues: kelas
      ? {
          name:          kelas.name,
          teacher_id:    kelas.teacher?.id ?? '',
          academic_year: kelas.academic_year,
          description:   kelas.description ?? '',
        }
      : { academic_year: '2025/2026' },
  })

  const isPending = createClass.isPending || updateClass.isPending

  return (
    <Modal open title={isEdit ? 'Edit Kelas' : 'Buat Kelas Baru'} onClose={onClose}>
      <form
        onSubmit={handleSubmit((data) => {
          if (isEdit) {
            updateClass.mutate({ id: kelas!.id, data }, { onSuccess: onClose })
          } else {
            createClass.mutate(data, { onSuccess: onClose })
          }
        })}
        className="px-6 py-5 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Nama Kelas</label>
            <input {...register('name')} className="form-input" placeholder="Kelas A" />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="form-label">Tahun Ajaran</label>
            <input {...register('academic_year')} className="form-input" placeholder="2025/2026" />
            {errors.academic_year && <p className="form-error">{errors.academic_year.message}</p>}
          </div>
        </div>

        <div>
          <label className="form-label">Guru Pengampu</label>
          <select {...register('teacher_id')} className="form-select">
            <option value="">Pilih guru</option>
            {guruList.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          {errors.teacher_id && <p className="form-error">{errors.teacher_id.message}</p>}
        </div>

        <div>
          <label className="form-label">
            Deskripsi <span className="normal-case font-normal text-slate-400">(opsional)</span>
          </label>
          <textarea
            {...register('description')}
            rows={2}
            className="form-input resize-none"
            placeholder="Contoh: Kelas untuk usia 5-6 tahun, jadwal pagi"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={isPending}>
            Batal
          </button>
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Kelas'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
