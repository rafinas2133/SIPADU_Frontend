import { useState } from 'react'
import { Download, FileText, Loader2, CheckCircle } from 'lucide-react'
import { useClasses } from '@/hooks'
import { reportsApi } from '@/services'
import { downloadBlob } from '@/utils'
import toast from 'react-hot-toast'

export default function EksporPage() {
  const [classFilter, setClassFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { data: classes } = useClasses()

  const handleExportCSV = async () => {
    setLoading(true)
    setDone(false)
    try {
      const res = await reportsApi.exportCsv(classFilter || undefined)
      downloadBlob(res.data as Blob, `data-siswa-${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.csv`)
      setDone(true)
      toast.success('Data berhasil diunduh')
    } catch {
      toast.error('Gagal mengunduh data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-xl">
      <div>
        <h1 className="page-title">Ekspor Data</h1>
        <p className="page-subtitle">Unduh data siswa dan hasil prediksi dalam format CSV</p>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <label className="form-label">Filter Kelas (opsional)</label>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="form-select">
            <option value="">Semua Kelas</option>
            {(classes?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.academic_year}</option>
            ))}
          </select>
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">File CSV akan berisi:</p>
          <ul className="text-xs text-slate-500 space-y-1">
            {['NIS', 'Nama siswa', 'Kelas', 'Tanggal lahir', 'Skor observasi (5 aspek)', 'Hasil prediksi CART', 'Tingkat kepercayaan model'].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <button onClick={handleExportCSV} disabled={loading} className="btn-primary w-full justify-center">
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Mengunduh...</>
          ) : done ? (
            <><CheckCircle size={16} /> Unduh Lagi</>
          ) : (
            <><Download size={16} /> Unduh CSV</>
          )}
        </button>
      </div>

      <div className="card p-5 border-blue-100 bg-blue-50">
        <div className="flex items-start gap-3">
          <FileText size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Format CSV</p>
            <p className="text-xs text-blue-600 mt-1">
              File CSV dapat dibuka langsung di Microsoft Excel, Google Sheets, atau LibreOffice Calc.
              Pastikan encoding UTF-8 dipilih saat membuka file untuk menampilkan karakter Indonesia dengan benar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
