import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer, ExternalLink, FileText, Loader2 } from 'lucide-react'
import { useChildren, useBukuPenghubungData } from '@/hooks'
import { PageLoader, SectionHeader, TalentBadge } from '@/components/ui'
import { fDate, calcAge, talentColor, fConfidence, toConfidence } from '@/utils'
import { reportsApi } from '@/services'
import type { TalentCategory } from '@/types'

export default function BukuPenghubungPage() {
  const { id: paramId } = useParams<{ id?: string }>()
  const [selectedChildId, setSelectedChildId] = useState(paramId ?? '')
  const [teacherNote, setTeacherNote] = useState('')
  const [period, setPeriod] = useState(() => {
    const now = new Date()
    return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  })

  const { data: childData } = useChildren({ limit: 100 })
  const { data: report, isLoading } = useBukuPenghubungData(
    selectedChildId,
    { note: teacherNote, period }
  )

  const children = childData?.data ?? []

  const openHTML = () => {
    const token = document.cookie // token is handled via httpOnly cookie
    const url = reportsApi.getBukuPenghubungHtml(selectedChildId, { note: teacherNote, period })
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        {paramId && (
          <Link to={`/siswa/${paramId}`} className="text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={18} />
          </Link>
        )}
        <div>
          <h1 className="page-title">Buku Penghubung</h1>
          <p className="page-subtitle">Generate laporan perkembangan anak untuk orang tua</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Settings panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <SectionHeader title="Pengaturan Laporan" />

            <div className="space-y-4">
              <div>
                <label className="form-label">Pilih Siswa</label>
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Pilih siswa --</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.class?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Periode Laporan</label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="form-input"
                  placeholder="Contoh: Juni 2026 / Semester 1 2026"
                />
              </div>

              <div>
                <label className="form-label">
                  Catatan Guru <span className="normal-case font-normal text-slate-400">(opsional)</span>
                </label>
                <textarea
                  value={teacherNote}
                  onChange={(e) => setTeacherNote(e.target.value)}
                  rows={5}
                  placeholder="Tuliskan pesan, perkembangan yang perlu diperhatikan, atau saran untuk orang tua..."
                  className="form-input resize-none"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={openHTML}
                  disabled={!selectedChildId}
                  className="btn-primary justify-center"
                >
                  <ExternalLink size={15} /> Buka & Cetak (HTML)
                </button>
                <button
                  disabled={!selectedChildId}
                  className="btn-secondary justify-center"
                  onClick={openHTML}
                >
                  <Printer size={15} /> Preview Cetak
                </button>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="card p-5 bg-blue-50 border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-2">💡 Cara Mencetak</p>
            <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
              <li>Klik "Buka & Cetak (HTML)" di atas</li>
              <li>Halaman buku akan terbuka di tab baru</li>
              <li>Tekan Ctrl+P (Windows) atau Cmd+P (Mac)</li>
              <li>Pilih printer atau "Save as PDF"</li>
              <li>Atur kertas A4, orientasi Portrait</li>
            </ol>
          </div>
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <FileText size={15} className="text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">Preview Buku Penghubung</span>
            </div>

            {!selectedChildId ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="font-semibold text-slate-700">Pilih Siswa Terlebih Dahulu</h3>
                <p className="text-sm text-slate-500 mt-1">Preview buku penghubung akan muncul di sini</p>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <p className="text-sm text-slate-500">Menyiapkan laporan...</p>
                </div>
              </div>
            ) : report ? (
              <BukuPreview report={report} period={period} note={teacherNote} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Preview component ─────────────────────────────────────────────────────────
function BukuPreview({ report, period, note }: { report: any; period: string; note: string }) {
  const pred = report.prediction
  const predColor = pred ? talentColor(pred.category as TalentCategory) : '#6B7280'
  const ASPECT_LABELS: Record<string, string> = {
    bahasa: 'Bahasa', motorik_halus: 'Motorik Halus',
    motorik_kasar: 'Motorik Kasar', kognitif: 'Kognitif',
    sosial_emosional: 'Sosial Emosional',
  }

  return (
    <div className="p-6 font-serif text-sm text-slate-800 bg-white min-h-96">
      {/* Header */}
      <div className="text-center border-b-2 border-blue-600 pb-4 mb-5">
        <p className="text-base font-bold text-blue-700">TK / PAUD HARAPAN BANGSA</p>
        <p className="text-xs text-slate-500">Buku Penghubung Perkembangan Anak</p>
        <p className="text-xs text-slate-400 mt-1">Periode: {period}</p>
      </div>

      {/* Identitas */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mb-5 text-xs">
        {[
          ['Nama', report.child.name],
          ['NIS', report.child.nis],
          ['Kelas', report.child.class_name],
          ['Jenis Kelamin', report.child.gender],
          ['Tanggal Lahir', fDate(report.child.birth_date)],
          ['Usia', `${report.child.age.years} thn ${report.child.age.months} bln`],
          ['Guru Kelas', report.child.teacher_name],
          ['Tgl. Observasi', report.latest_observation ? fDate(report.latest_observation.date) : '-'],
        ].map(([l, v]) => (
          <div key={l} className="flex gap-2 border-b border-slate-100 py-1">
            <span className="text-slate-500 w-28 flex-shrink-0">{l}</span>
            <span className="font-semibold text-slate-800">{v}</span>
          </div>
        ))}
      </div>

      {/* Scores table */}
      {report.latest_observation && (
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Hasil Observasi Perkembangan</p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-2 border border-slate-200 font-semibold">Aspek</th>
                <th className="text-center p-2 border border-slate-200 font-semibold w-16">Nilai</th>
                <th className="text-left p-2 border border-slate-200 font-semibold">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(report.latest_observation.score_labels).map(([k, label]) => {
                const score = report.latest_observation.scores[k]
                return (
                  <tr key={k}>
                    <td className="p-2 border border-slate-200">{ASPECT_LABELS[k]}</td>
                    <td className="p-2 border border-slate-200 text-center font-bold">{score}/4</td>
                    <td className="p-2 border border-slate-200 text-slate-600">{label as string}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Prediction result */}
      {pred && (
        <div className="mb-5 p-3 rounded-lg border-l-4" style={{ borderColor: predColor, background: predColor + '10' }}>
          <p className="text-xs font-bold text-slate-600 mb-1">Hasil Analisis CART (Machine Learning)</p>
          <p className="text-base font-black" style={{ color: predColor }}>
            {pred.category === 'Linguistik' && '📚 '}
            {pred.category === 'Seni' && '🎨 '}
            {pred.category === 'Kinestetik' && '⚽ '}
            {pred.category === 'Butuh Stimulasi' && '🌱 '}
            {pred.category}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Kepercayaan model: {fConfidence(pred.confidence, 1)}%</p>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations?.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Rekomendasi Stimulasi di Rumah</p>
          <ol className="text-xs space-y-1 text-slate-700 list-decimal list-inside">
            {report.recommendations.map((r: string, i: number) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Teacher note */}
      {note && (
        <div className="mb-5 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs font-bold text-amber-700 mb-1">Catatan Guru</p>
          <p className="text-xs text-amber-800 whitespace-pre-line">{note}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="mt-8 grid grid-cols-2 gap-8">
        {['Orang Tua / Wali', `Guru Kelas\n${report.child.teacher_name}`].map((label) => (
          <div key={label} className="text-center">
            <div className="h-12" />
            <div className="border-t border-slate-400 pt-1">
              <p className="text-xs text-slate-600 whitespace-pre-line">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-300 text-center mt-6">
        Dicetak: {new Date().toLocaleString('id-ID')} · SIPADU CART v1.0
      </p>
    </div>
  )
}
