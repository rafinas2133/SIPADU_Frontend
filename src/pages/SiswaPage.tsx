import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, Eye, Pencil, Trash2, Filter } from 'lucide-react'
import { useChildren, useDeleteChild, useClasses } from '@/hooks'
import {
  PageLoader, EmptyState, TalentBadge, ConfirmDialog,
  Pagination, Spinner,
} from '@/components/ui'
import { fDateShort, calcAge, genderLabel } from '@/utils'
import type { Child, TalentCategory } from '@/types'
import { ChildFormModal } from '@/components/forms/ChildForm'

function getLatestPrediction(child: Child) {
  return child.observations?.[0]?.prediction ?? child.latest_prediction ?? null
}

export default function SiswaPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState(() => searchParams.get('class_id') ?? '')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editChild, setEditChild] = useState<Child | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    const urlClassId = searchParams.get('class_id') ?? ''
    setClassFilter(urlClassId)
    setPage(1)
  }, [searchParams])

  const updateClassFilter = (value: string) => {
    setClassFilter(value)
    setPage(1)
    const next = new URLSearchParams(searchParams)
    if (value) next.set('class_id', value)
    else next.delete('class_id')
    setSearchParams(next, { replace: true })
  }

  const { data, isLoading } = useChildren({
    page,
    limit: 15,
    search: search || undefined,
    class_id: classFilter || undefined,
  })
  const { data: classes } = useClasses()
  const deleteChild = useDeleteChild()

  const children = data?.data ?? []
  const meta = data?.meta
  const activeClassName = (classes?.data ?? []).find((c) => c.id === classFilter)?.name

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="page-title">Data Siswa</h1>
          <p className="page-subtitle">
            {meta?.total ?? 0} siswa terdaftar
            {activeClassName ? ` · filter: ${activeClassName}` : ''}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary self-start sm:self-auto">
          <Plus size={16} /> Tambah Siswa
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="form-input pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={classFilter}
            onChange={(e) => updateClassFilter(e.target.value)}
            className="form-select w-40"
          >
            <option value="">Semua Kelas</option>
            {(classes?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : children.length === 0 ? (
          <EmptyState
            title="Belum ada data siswa"
            description={classFilter
              ? 'Tidak ada siswa di kelas ini. Coba pilih kelas lain atau tambah siswa baru.'
              : 'Tambahkan siswa untuk mulai melakukan observasi'}
            action={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15} /> Tambah Siswa</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Nama Siswa</th>
                  <th>NIS</th>
                  <th>Kelas</th>
                  <th>JK / Usia</th>
                  <th>Prediksi Terakhir</th>
                  <th>Tgl. Lahir</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {children.map((child, i) => {
                  const pred = getLatestPrediction(child)
                  return (
                    <tr key={child.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                            {child.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900 truncate max-w-[140px]">{child.name}</span>
                        </div>
                      </td>
                      <td className="font-mono text-slate-500 text-xs">{child.nis}</td>
                      <td>
                        {child.class && (
                          <span className="badge-slate">{child.class.name}</span>
                        )}
                      </td>
                      <td className="text-slate-600">
                        {genderLabel(child.gender)} · {calcAge(child.birth_date)}
                      </td>
                      <td>
                        {pred ? (
                          <TalentBadge category={pred.prediction as TalentCategory} />
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum diobservasi</span>
                        )}
                      </td>
                      <td className="text-slate-500">{fDateShort(child.birth_date)}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/siswa/${child.id}`} className="btn-ghost btn-sm p-1.5 text-blue-600" title="Lihat">
                            <Eye size={15} />
                          </Link>
                          <button onClick={() => setEditChild(child)} className="btn-ghost btn-sm p-1.5 text-slate-500" title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setDeleteId(child.id)} className="btn-ghost btn-sm p-1.5 text-red-400 hover:text-red-600" title="Hapus">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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

      {/* Modals */}
      {showAdd && <ChildFormModal onClose={() => setShowAdd(false)} />}
      {editChild && <ChildFormModal child={editChild} onClose={() => setEditChild(null)} />}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteChild.mutate(deleteId, { onSuccess: () => setDeleteId(null) }) } }}
        title="Hapus Data Siswa"
        message="Data siswa beserta seluruh riwayat observasi dan prediksinya akan dihapus. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        loading={deleteChild.isPending}
      />
    </div>
  )
}
