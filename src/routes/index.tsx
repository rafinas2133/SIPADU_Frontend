import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute, GuestRoute } from './guards'
import { PageLoader } from '@/components/ui'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const SiswaPage = lazy(() => import('@/pages/SiswaPage'))
const ProfilSiswaPage = lazy(() => import('@/pages/ProfilSiswaPage'))
const ObservasiPage = lazy(() => import('@/pages/ObservasiPage'))
const HasilCARTPage = lazy(() => import('@/pages/HasilCARTPage'))
const BukuPenghubungPage = lazy(() => import('@/pages/BukuPenghubungPage'))
const EksporPage = lazy(() => import('@/pages/EksporPage'))
const ProfilPage = lazy(() => import('@/pages/ProfilPage'))
const KelasPage = lazy(() => import('@/pages/KelasPage'))
const AdminUsersPage = lazy(() => import('@/pages/AdminPages').then(m => ({ default: m.AdminUsersPage })))
const AdminAuditPage = lazy(() => import('@/pages/AdminPages').then(m => ({ default: m.AdminAuditPage })))

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-slate-800">Halaman Tidak Ditemukan</h1>
      <p className="text-slate-500 mt-2">Halaman yang kamu cari tidak ada atau sudah dipindahkan.</p>
      <a href="/dashboard" className="btn-primary mt-6 inline-flex">Kembali ke Dashboard</a>
    </div>
  )
}

const wrap = (Page: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Page />
  </Suspense>
)

const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [{ path: '/login', element: wrap(LoginPage) }],
  },
  {
    element: <ProtectedRoute />,
    children: [{
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        { path: '/dashboard', element: wrap(DashboardPage) },
        { path: '/profil', element: wrap(ProfilPage) },
        { path: '/buku-penghubung', element: wrap(BukuPenghubungPage) },
        { path: '/buku-penghubung/:id', element: wrap(BukuPenghubungPage) },
        {
          element: <ProtectedRoute roles={['admin', 'guru']} />,
          children: [
            { path: '/siswa', element: wrap(SiswaPage) },
            { path: '/siswa/:id', element: wrap(ProfilSiswaPage) },
            { path: '/observasi', element: wrap(ObservasiPage) },
            { path: '/observasi/baru', element: wrap(ObservasiPage) },
            { path: '/hasil-cart', element: wrap(HasilCARTPage) },
            { path: '/ekspor', element: wrap(EksporPage) },
          ],
        },
        {
          element: <ProtectedRoute roles={['admin']} />,
          children: [
            { path: '/admin/users', element: wrap(AdminUsersPage) },
            { path: '/admin/kelas', element: wrap(KelasPage) },
            { path: '/admin/audit', element: wrap(AdminAuditPage) },
          ],
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    }],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}