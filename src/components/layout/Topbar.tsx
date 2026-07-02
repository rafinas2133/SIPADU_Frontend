import { Bell, Search, Plus } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
import { fDate } from '@/utils'
import { useAuthStore } from '@/stores/auth.store'

const PAGE_META: Record<string, { title: string; subtitle?: string; action?: React.ReactNode }> = {
  '/dashboard':        { title: 'Dashboard' },
  '/siswa':            { title: 'Data Siswa',        subtitle: 'Kelola data siswa' },
  '/observasi':        { title: 'Observasi',          subtitle: 'Input & kelola data observasi' },
  '/observasi/baru':   { title: 'Observasi Baru',    subtitle: 'Tambah data observasi siswa' },
  '/hasil-cart':       { title: 'Hasil CART',         subtitle: 'Analisis model & prediksi bakat' },
  '/buku-penghubung':  { title: 'Buku Penghubung',   subtitle: 'Laporan perkembangan untuk orang tua' },
  '/ekspor':           { title: 'Ekspor Data',        subtitle: 'Unduh data dalam format CSV' },
  '/admin/users':      { title: 'Kelola Pengguna',   subtitle: 'Manajemen akun pengguna sistem' },
  '/admin/kelas':      { title: 'Kelola Kelas',       subtitle: 'Manajemen kelas dan guru pengampu' },
  '/admin/audit':      { title: 'Audit Log',          subtitle: 'Riwayat seluruh aktivitas sistem' },
  '/profil':           { title: 'Profil Saya',        subtitle: 'Pengaturan akun dan keamanan' },
  '/perkembangan':     { title: 'Perkembangan Anak', subtitle: 'Pantau kemajuan belajar anak Anda' },
}

export function Topbar() {
  const { pathname } = useLocation()
  const { user }     = useAuthStore()

  // Match exact or strip trailing segments
  const meta =
    PAGE_META[pathname] ??
    PAGE_META[pathname.split('/').slice(0, 2).join('/')] ??
    { title: 'SIPADU CART' }

  const today = fDate(new Date(), "EEEE, d MMMM yyyy")

  return (
    <header className="flex-shrink-0 h-14 bg-white border-b border-slate-200 flex items-center
                       justify-between px-6 shadow-sm gap-4">
      {/* Title */}
      <div className="min-w-0">
        <h1 className="text-base font-bold text-slate-900 leading-tight truncate">
          {meta.title}
        </h1>
        <p className="text-xs text-slate-400 leading-tight mt-0.5">
          {meta.subtitle ?? today}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search bar — hidden on small screens */}
        <div className="relative hidden sm:block">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari siswa..."
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                       w-40 focus:w-52 transition-all duration-200 placeholder:text-slate-400"
          />
        </div>

        {/* Quick new observation button (guru/admin only) */}
        {(user?.role === 'guru' || user?.role === 'admin') && pathname !== '/observasi/baru' && (
          <Link
            to="/observasi/baru"
            className="btn-primary btn-sm hidden sm:inline-flex"
          >
            <Plus size={13} /> Observasi
          </Link>
        )}

        {/* Notification bell */}
        <button
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100
                     rounded-lg transition-colors"
          title="Notifikasi"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
