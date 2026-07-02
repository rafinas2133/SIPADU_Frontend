import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, ClipboardList, Brain, BookOpen,
  Download, LogOut, ChevronRight, School, UserCircle,
  TrendingUp, ShieldAlert, Loader2,
} from 'lucide-react'
import { cn } from '@/utils'
import { useAuthStore } from '@/stores/auth.store'
import { useLogout } from '@/hooks'

// ── Menu definitions per role ─────────────────────────────────────────────────
const MENU_GURU = [
  { to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/siswa',            icon: Users,           label: 'Data Siswa' },
  { to: '/observasi',        icon: ClipboardList,   label: 'Observasi' },
  { to: '/hasil-cart',       icon: Brain,           label: 'Hasil CART' },
  { to: '/buku-penghubung',  icon: BookOpen,        label: 'Buku Penghubung' },
  { to: '/ekspor',           icon: Download,        label: 'Ekspor Data' },
]

const MENU_ADMIN = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users',  icon: Users,           label: 'Kelola Pengguna' },
  { to: '/admin/kelas',  icon: School,          label: 'Kelola Kelas' },
  { to: '/siswa',        icon: Users,           label: 'Data Siswa' },
  { to: '/observasi',    icon: ClipboardList,   label: 'Observasi' },
  { to: '/hasil-cart',   icon: Brain,           label: 'Model CART' },
  { to: '/ekspor',       icon: Download,        label: 'Ekspor Data' },
  { to: '/admin/audit',  icon: ShieldAlert,     label: 'Audit Log' },
]

const MENU_ORTU = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Beranda' },
  { to: '/perkembangan',    icon: TrendingUp,      label: 'Perkembangan Anak' },
  { to: '/buku-penghubung', icon: BookOpen,        label: 'Buku Penghubung' },
]

const ROLE_LABEL: Record<string, string> = {
  admin:      'Administrator',
  guru:       'Guru Kelas',
  orang_tua:  'Orang Tua',
}

// ── Sidebar component ─────────────────────────────────────────────────────────
export function Sidebar() {
  const { user } = useAuthStore()
  const logout   = useLogout()

  const menu =
    user?.role === 'admin'      ? MENU_ADMIN :
    user?.role === 'orang_tua'  ? MENU_ORTU  :
    MENU_GURU

  const initials = user?.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() ?? '?'

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex flex-col w-60
                      bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl">
      {/* ── Logo ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center
                        shadow-lg shadow-blue-600/40 flex-shrink-0 text-xl">
          🌱
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight">SIPADU CART</p>
          <p className="text-slate-400 text-[10px] truncate mt-0.5">Perkembangan Anak Usia Dini</p>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2 mb-3">
          Menu Utama
        </p>

        {menu.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                'transition-all duration-150 group',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className="flex-shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {isActive && (
                  <ChevronRight size={13} className="opacity-60 flex-shrink-0" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Divider + Profile */}
        <div className="pt-3 mt-3 border-t border-white/10">
          <NavLink
            to="/profil"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              )
            }
          >
            <UserCircle size={16} />
            <span>Profil Saya</span>
          </NavLink>
        </div>
      </nav>

      {/* ── User footer ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-3 pb-4 pt-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600
                          flex items-center justify-center text-white text-xs font-bold
                          flex-shrink-0 shadow-md shadow-blue-600/30">
            {initials}
          </div>

          {/* Name + Role */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-slate-400 text-[10px] truncate">
              {ROLE_LABEL[user?.role ?? ''] ?? user?.role}
            </p>
          </div>

          {/* Logout button */}
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg
                       hover:bg-red-400/10 disabled:opacity-50"
            title="Keluar dari sistem"
          >
            {logout.isPending
              ? <Loader2 size={15} className="animate-spin" />
              : <LogOut size={15} />
            }
          </button>
        </div>
      </div>
    </aside>
  )
}
