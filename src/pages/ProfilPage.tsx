import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Lock, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { useMe } from '@/hooks'
import { useMutation } from '@tanstack/react-query'
import { usersApi } from '@/services'
import { useAuthStore } from '@/stores/auth.store'
import { PageLoader, SectionHeader } from '@/components/ui'
import { fDateTime } from '@/utils'
import toast from 'react-hot-toast'

// ── Schemas ───────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Password lama wajib diisi'),
  new_password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Harus mengandung huruf besar')
    .regex(/[0-9]/, 'Harus mengandung angka'),
  confirm_password: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirm_password'],
})

type ProfileForm   = z.infer<typeof profileSchema>
type PasswordForm  = z.infer<typeof passwordSchema>

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator', guru: 'Guru Kelas', orang_tua: 'Orang Tua',
}
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-violet-100 text-violet-700',
  guru:  'bg-blue-100 text-blue-700',
  orang_tua: 'bg-emerald-100 text-emerald-700',
}

export default function ProfilPage() {
  const { data: me, isLoading } = useMe()
  const { user: storeUser, setAuth, accessToken } = useAuthStore()
  const user = me ?? storeUser
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
    values: { name: user?.name ?? '' },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  // Update profile name
  const updateProfile = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) =>
      usersApi.update(id, data),
    onSuccess: (res) => {
      if (accessToken) setAuth(res.data.data, accessToken)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
      toast.success('Profil berhasil diperbarui')
    },
  })

  // Change password
  const changePassword = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { password: string } }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      passwordForm.reset()
      toast.success('Password berhasil diubah')
    },
  })

  if (isLoading) return <PageLoader />

  const initials = user?.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() ?? '?'

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Profil Saya</h1>
        <p className="page-subtitle">Kelola informasi akun dan keamanan</p>
      </div>

      {/* Avatar & identity card */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/25 flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge text-xs ${ROLE_COLORS[user?.role ?? ''] ?? 'bg-slate-100 text-slate-600'}`}>
                {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
              </span>
              <span className="badge-green text-xs">Aktif</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-100 text-sm">
          <div>
            <p className="text-xs text-slate-500">Bergabung sejak</p>
            <p className="font-medium text-slate-800 mt-0.5">{user?.created_at ? fDateTime(user.created_at) : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Terakhir diperbarui</p>
            <p className="font-medium text-slate-800 mt-0.5">{user?.updated_at ? fDateTime(user.updated_at) : '-'}</p>
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="card p-6">
        <SectionHeader
          title="Informasi Profil"
          subtitle="Perbarui nama tampilan akun Anda"
        />
        <form
          onSubmit={profileForm.handleSubmit((data) => {
            if (user) updateProfile.mutate({ id: user.id, data })
          })}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nama Lengkap</label>
              <input
                {...profileForm.register('name')}
                className="form-input"
                placeholder="Nama lengkap Anda"
              />
              {profileForm.formState.errors.name && (
                <p className="form-error">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                value={user?.email ?? ''}
                disabled
                className="form-input bg-slate-50 text-slate-400 cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">Email tidak dapat diubah</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="btn-primary"
            >
              {updateProfile.isPending
                ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
                : profileSaved
                ? <><CheckCircle size={15} /> Tersimpan!</>
                : <><User size={15} /> Simpan Profil</>}
            </button>
            {profileSaved && (
              <p className="text-xs text-emerald-600 animate-fade-in">Profil berhasil diperbarui</p>
            )}
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <SectionHeader
          title="Ubah Password"
          subtitle="Gunakan password yang kuat dan unik"
        />
        <form
          onSubmit={passwordForm.handleSubmit((data) => {
            if (user) changePassword.mutate({ id: user.id, data: { password: data.new_password } })
          })}
          className="space-y-4"
        >
          {/* Current password */}
          <div>
            <label className="form-label">Password Saat Ini</label>
            <div className="relative">
              <input
                {...passwordForm.register('current_password')}
                type={showCurrent ? 'text' : 'password'}
                className="form-input pr-10"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {passwordForm.formState.errors.current_password && (
              <p className="form-error">{passwordForm.formState.errors.current_password.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* New password */}
            <div>
              <label className="form-label">Password Baru</label>
              <div className="relative">
                <input
                  {...passwordForm.register('new_password')}
                  type={showNew ? 'text' : 'password'}
                  className="form-input pr-10"
                  placeholder="Min. 8 karakter"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordForm.formState.errors.new_password && (
                <p className="form-error">{passwordForm.formState.errors.new_password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="form-label">Konfirmasi Password</label>
              <input
                {...passwordForm.register('confirm_password')}
                type="password"
                className="form-input"
                placeholder="Ulangi password baru"
                autoComplete="new-password"
              />
              {passwordForm.formState.errors.confirm_password && (
                <p className="form-error">{passwordForm.formState.errors.confirm_password.message}</p>
              )}
            </div>
          </div>

          {/* Password strength hints */}
          <div className="bg-slate-50 rounded-lg px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-slate-600 mb-2">Syarat password:</p>
            {[
              { label: 'Minimal 8 karakter', check: (v: string) => v.length >= 8 },
              { label: 'Mengandung huruf besar (A-Z)', check: (v: string) => /[A-Z]/.test(v) },
              { label: 'Mengandung angka (0-9)', check: (v: string) => /[0-9]/.test(v) },
            ].map(({ label, check }) => {
              const val = passwordForm.watch('new_password') ?? ''
              const ok = val.length > 0 && check(val)
              return (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span className={ok ? 'text-emerald-500' : 'text-slate-400'}>
                    {ok ? '✓' : '○'}
                  </span>
                  <span className={ok ? 'text-emerald-700' : 'text-slate-500'}>{label}</span>
                </div>
              )
            })}
          </div>

          <button
            type="submit"
            disabled={changePassword.isPending}
            className="btn-primary"
          >
            {changePassword.isPending
              ? <><Loader2 size={15} className="animate-spin" /> Mengubah...</>
              : <><Lock size={15} /> Ubah Password</>}
          </button>
        </form>
      </div>

      {/* Session info */}
      <div className="card p-5 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">🔐</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Keamanan Akun</p>
            <p className="text-xs text-amber-700 mt-1">
              Sesi login otomatis berakhir setelah 15 menit tidak aktif. Token refresh berlaku 7 hari.
              Jika akun Anda terasa mencurigakan, segera hubungi administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
