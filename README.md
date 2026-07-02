# SIPADU CART — Frontend React

> Interface web modern untuk Sistem Rekomendasi Perkembangan Anak Usia Dini.
> Dibangun dengan React 18 + Vite + TypeScript + Tailwind CSS.

---

## Teknologi

| Library | Versi | Kegunaan |
|---------|-------|---------|
| React | 18 | UI framework |
| Vite | 5 | Build tool + dev server |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3 | Styling |
| TanStack Query | 5 | Server state, caching, mutations |
| Zustand | 4 | Client state (auth) |
| React Router DOM | 6 | Routing + lazy loading |
| React Hook Form | 7 | Form management |
| Zod | 3 | Form validation schema |
| Recharts | 2 | Charts: line, pie, radar, bar |
| Axios | 1.7 | HTTP client + interceptors |
| date-fns | 3 | Date formatting (locale id) |
| react-hot-toast | 2 | Toast notifications |
| Vite PWA | 0.20 | Progressive Web App support |

---

## Struktur Folder

```
frontend/src/
├── components/
│   ├── charts/
│   │   └── index.tsx          # Recharts wrappers: TalentDistributionBar,
│   │                          #   ProgressLineChart, ModelRadarChart, dll
│   ├── forms/
│   │   ├── ChildForm.tsx      # Modal form tambah/edit siswa
│   │   └── ObservationForm.tsx# Form observasi reusable (Likert selector)
│   ├── layout/
│   │   ├── AppLayout.tsx      # Shell: Sidebar + Topbar + <Outlet>
│   │   ├── Sidebar.tsx        # Navigasi per role (admin/guru/orang_tua)
│   │   └── Topbar.tsx         # Header: judul halaman + search + notif
│   └── ui/
│       ├── index.tsx          # StatCard, TalentBadge, ConfidenceBar,
│       │                      #   Modal, ConfirmDialog, EmptyState, Pagination
│       └── Table.tsx          # DataTable dengan sort & skeleton loading
├── hooks/
│   └── index.ts               # 35+ React Query hooks (useLogin, useChildren, dll)
├── pages/
│   ├── LoginPage.tsx          # Form login + demo accounts
│   ├── DashboardPage.tsx      # Stat cards, pie chart, aktivitas, tabel siswa
│   ├── SiswaPage.tsx          # CRUD siswa + search + filter kelas
│   ├── ProfilSiswaPage.tsx    # Detail siswa: radar, line chart, riwayat
│   ├── ObservasiPage.tsx      # Form Likert + panel prediksi real-time
│   ├── HasilCARTPage.tsx      # 4 tab: overview, pohon, rules, riwayat
│   ├── BukuPenghubungPage.tsx # Preview + print buku penghubung
│   ├── PerkembanganPage.tsx   # Dashboard orang tua
│   ├── ProfilPage.tsx         # Edit profil + ganti password
│   ├── KelasPage.tsx          # Admin: kelola kelas (CRUD)
│   ├── EksporPage.tsx         # Unduh CSV
│   └── AdminPages.tsx         # Admin: kelola user + audit log
├── routes/
│   ├── guards.tsx             # ProtectedRoute (RBAC) + GuestRoute
│   └── index.tsx              # Semua routes + lazy loading
├── services/
│   ├── api.ts                 # Axios instance + auto token refresh
│   └── index.ts               # Semua API service functions
├── stores/
│   └── auth.store.ts          # Zustand auth state + persist
├── types/
│   └── index.ts               # TypeScript interfaces + konstanta
└── utils/
    └── index.ts               # cn(), fDate, likertLabel, talentColor, calcAge, dll
```

---

## Instalasi & Menjalankan

### Development

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
# → http://localhost:5173
```

Backend berjalan di `localhost:3000` dan di-proxy otomatis oleh Vite.

### Production Build

```bash
npm run build
npm run preview   # Preview build lokal
```

### Via Docker

```bash
# Dari root project (bersama backend + ml-service)
docker-compose up -d --build frontend
# → http://localhost
```

---

## Halaman & Akses per Role

| Halaman | Path | Admin | Guru | Orang Tua |
|---------|------|:-----:|:----:|:---------:|
| Dashboard | `/dashboard` | ✅ | ✅ | ✅ |
| Data Siswa | `/siswa` | ✅ | ✅ | ❌ |
| Profil Siswa | `/siswa/:id` | ✅ | ✅ | ❌ |
| Observasi | `/observasi` | ✅ | ✅ | ❌ |
| Hasil CART | `/hasil-cart` | ✅ | ✅ | ❌ |
| Buku Penghubung | `/buku-penghubung` | ✅ | ✅ | ✅ |
| Ekspor Data | `/ekspor` | ✅ | ✅ | ❌ |
| Perkembangan | `/perkembangan` | ❌ | ❌ | ✅ |
| Profil Saya | `/profil` | ✅ | ✅ | ✅ |
| Kelola Pengguna | `/admin/users` | ✅ | ❌ | ❌ |
| Kelola Kelas | `/admin/kelas` | ✅ | ❌ | ❌ |
| Audit Log | `/admin/audit` | ✅ | ❌ | ❌ |

---

## Fitur Utama

### Autentikasi
- Login dengan email + password
- JWT access token (15 menit) + refresh token (7 hari via cookie httpOnly)
- Auto-refresh token ketika 401 — transparan untuk user
- Logout clear token server + client state
- Route guard per role (RBAC)
- Persist auth ke localStorage via Zustand

### Observasi & Prediksi
- Form Likert 4-pilihan interaktif per 5 aspek perkembangan
- Preview hasil prediksi CART langsung setelah submit
- Bar probabilitas 4 kategori bakat
- Rekomendasi stimulasi otomatis berdasarkan prediksi

### Dashboard
- Counter animasi untuk stat cards
- Pie chart distribusi bakat seluruh siswa
- Timeline aktivitas real-time (polling 30 detik)
- Tabel siswa dengan prediksi terakhir

### Hasil CART (4 tab)
- Radar chart 4 metrik (Accuracy, Precision, Recall, F1)
- Confusion matrix dengan heat-map warna
- Pohon keputusan SVG interaktif
- Rule IF-THEN dengan feature importance
- Riwayat training model

### Buku Penghubung
- Preview live sebelum cetak
- Print via browser (Ctrl+P / Cmd+P) → simpan PDF
- Form catatan guru
- Data lengkap: identitas, skor, prediksi, rekomendasi, tanda tangan

---

## Design System

### Palet Warna
| Token | Hex | Kegunaan |
|-------|-----|---------|
| Blue 600 | `#2563EB` | Primary, Linguistik |
| Emerald 500 | `#10B981` | Success, Seni |
| Amber 500 | `#F59E0B` | Warning, Kinestetik |
| Red 500 | `#EF4444` | Danger, Butuh Stimulasi |
| Slate 900 | `#0F172A` | Text primer |
| Slate 50 | `#F8FAFC` | Background |

### Komponen Utama
```tsx
// StatCard dengan animasi counter
<StatCard label="Total Siswa" value={48} accent="border-blue-500" ... />

// Badge bakat dengan warna otomatis
<TalentBadge category="Linguistik" />

// Confidence bar berwarna berdasarkan nilai
<ConfidenceBar value={88.5} />

// Modal dengan backdrop
<Modal open={show} onClose={() => setShow(false)} title="Edit Siswa">
  {/* content */}
</Modal>

// Confirm dialog
<ConfirmDialog open={del} onConfirm={doDelete} title="Hapus?" ... />

// DataTable dengan sort client-side
<DataTable columns={cols} data={rows} sortable page={1} ... />
```

---

## Environment Variables

| Key | Default | Keterangan |
|-----|---------|-----------|
| `VITE_API_BASE_URL` | `/api` | URL base API (otomatis di-proxy saat dev) |
| `VITE_APP_NAME` | `SIPADU CART` | Nama aplikasi |
| `VITE_APP_VERSION` | `1.0.0` | Versi aplikasi |
