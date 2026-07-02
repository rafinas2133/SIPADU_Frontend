import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLogin } from '@/hooks'
import { useAuthStore } from '@/stores/auth.store'

const schema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const login = useLogin()
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    login.mutate(data, {
      onSuccess: () => navigate('/dashboard', { replace: true }),
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-8 animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 text-3xl">
              🌱
            </div>
            <h1 className="text-xl font-bold text-slate-900">SIPADU CART</h1>
            <p className="text-sm text-slate-500 mt-1">Sistem Perkembangan Anak Usia Dini</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="form-label">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="guru@sekolah.id"
                className="form-input"
                autoComplete="email"
                autoFocus
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="form-input pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <a href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Lupa password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={login.isPending}
              className="btn-primary w-full justify-center py-2.5"
            >
              {login.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Memproses...</>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Demo accounts hint */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center font-medium mb-2">Akun Demo</p>
            <div className="space-y-1.5">
              {[
                { role: 'Admin', email: 'admin@sipadu.sch.id' },
                { role: 'Guru', email: 'rina@sipadu.sch.id' },
                { role: 'Orang Tua', email: 'ahmad@gmail.com' },
              ].map(({ role, email }) => (
                <div key={role} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-1.5">
                  <span className="text-slate-500">{role}</span>
                  <span className="font-mono text-slate-700">{email}</span>
                </div>
              ))}
              <p className="text-[10px] text-slate-400 text-center mt-1">Password: Admin@12345</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
