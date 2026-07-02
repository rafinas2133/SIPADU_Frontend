// ── Admin: Kelola Pengguna ─────────────────────────────────────────────────────
import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, Shield } from 'lucide-react'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useAuditLogs } from '@/hooks'
import {
  PageLoader, EmptyState, ConfirmDialog, Modal,
  Pagination, SectionHeader,
} from '@/components/ui'
import { fDateTime, cn } from '@/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { User, UserRole } from '@/types'

const ROLE_BADGES: Record<UserRole, string> = {
  admin:      'bg-violet-100 text-violet-700',
  guru:       'bg-blue-100 text-blue-700',
  orang_tua:  'bg-emerald-100 text-emerald-700',
}
const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator', guru: 'Guru', orang_tua: 'Orang Tua',
}

export function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const { data, isLoading } = useUsers({ page, search: search || undefined, role: roleFilter || undefined })
  const deleteUser = useDeleteUser()

  const users = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Kelola Pengguna</h1>
          <p className="page-subtitle">{meta?.total ?? 0} pengguna terdaftar</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={15} /> Tambah Pengguna
        </button>
      </div>

      <div className="card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" placeholder="Cari nama atau email..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="form-input pl-9"
          />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }} className="form-select w-40">
          <option value="">Semua Role</option>
          <option value="admin">Administrator</option>
          <option value="guru">Guru</option>
          <option value="orang_tua">Orang Tua</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : users.length === 0 ? (
          <EmptyState title="Belum ada pengguna" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Bergabung</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="text-slate-600">{u.email}</td>
                    <td>
                      <span className={cn('badge text-xs', ROLE_BADGES[u.role])}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td>
                      <span className={cn('badge text-xs', u.is_active ? 'badge-green' : 'badge-red')}>
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="text-slate-500 text-xs">{fDateTime(u.created_at)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditUser(u)} className="btn-ghost btn-sm p-1.5 text-slate-500">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(u.id)} className="btn-ghost btn-sm p-1.5 text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta && <div className="px-5 pb-4"><Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} /></div>}
      </div>

      {showAdd && <UserFormModal onClose={() => setShowAdd(false)} />}
      {editUser && <UserFormModal user={editUser} onClose={() => setEditUser(null)} />}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteUser.mutate(deleteId, { onSuccess: () => setDeleteId(null) }) }}
        title="Nonaktifkan Pengguna"
        message="Pengguna akan dinonaktifkan dan tidak bisa login lagi. Data mereka tetap tersimpan."
        confirmLabel="Nonaktifkan"
        loading={deleteUser.isPending}
      />
    </div>
  )
}

// ── User form modal ───────────────────────────────────────────────────────────
const userSchema = z.object({
  name:     z.string().min(2, 'Nama minimal 2 karakter'),
  email:    z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter').optional().or(z.literal('')),
  role:     z.enum(['admin', 'guru', 'orang_tua']),
})
type UserForm = z.infer<typeof userSchema>

function UserFormModal({ user, onClose }: { user?: User; onClose: () => void }) {
  const isEdit = !!user
  const create = useCreateUser()
  const update = useUpdateUser()
  const isPending = create.isPending || update.isPending

  const { register, handleSubmit, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: user ? { name: user.name, email: user.email, role: user.role } : { role: 'guru' },
  })

  const onSubmit = (data: UserForm) => {
    const payload = { ...data, password: data.password || undefined }
    if (isEdit) {
      update.mutate({ id: user.id, data: payload }, { onSuccess: onClose })
    } else {
      create.mutate(payload as any, { onSuccess: onClose })
    }
  }

  return (
    <Modal open title={isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
        <div>
          <label className="form-label">Nama Lengkap</label>
          <input {...register('name')} className="form-input" placeholder="Nama lengkap" />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>
        <div>
          <label className="form-label">Email</label>
          <input {...register('email')} type="email" className="form-input" placeholder="email@contoh.com" />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>
        <div>
          <label className="form-label">Password {isEdit && <span className="normal-case font-normal text-slate-400">(kosongkan jika tidak diubah)</span>}</label>
          <input {...register('password')} type="password" className="form-input" placeholder={isEdit ? '••••••••' : 'Min. 8 karakter'} />
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>
        <div>
          <label className="form-label">Role</label>
          <select {...register('role')} className="form-select">
            <option value="guru">Guru</option>
            <option value="admin">Administrator</option>
            <option value="orang_tua">Orang Tua</option>
          </select>
        </div>
        <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={isPending}>Batal</button>
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Pengguna'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Admin: Audit Log ──────────────────────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  CREATE_OBSERVATION: 'bg-emerald-100 text-emerald-700',
  UPDATE_OBSERVATION: 'bg-blue-100 text-blue-700',
  DELETE_OBSERVATION: 'bg-red-100 text-red-700',
  CREATE_CHILD:       'bg-amber-100 text-amber-700',
  RETRAIN_MODEL:      'bg-violet-100 text-violet-700',
  LOGIN:              'bg-slate-100 text-slate-600',
  CREATE_USER:        'bg-teal-100 text-teal-700',
}

export function AdminAuditPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAuditLogs({ page })

  const logs = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Audit Log</h1>
        <p className="page-subtitle">Riwayat semua aktivitas pengguna dalam sistem</p>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : logs.length === 0 ? (
          <EmptyState title="Belum ada log aktivitas" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Aksi</th>
                  <th>Target</th>
                  <th>IP Address</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any, i: number) => (
                  <tr key={log.id} className="animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                    <td>
                      <div>
                        <p className="font-medium text-slate-800">{log.user?.name ?? 'Sistem'}</p>
                        <p className="text-xs text-slate-400">{log.user?.role}</p>
                      </div>
                    </td>
                    <td>
                      <span className={cn('badge text-[10px]', ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600')}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="text-slate-600 capitalize">{log.target_type}</td>
                    <td className="font-mono text-xs text-slate-500">{log.ip_address ?? '—'}</td>
                    <td className="text-slate-500 text-xs">{fDateTime(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta && <div className="px-5 pb-4"><Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} /></div>}
      </div>
    </div>
  )
}
