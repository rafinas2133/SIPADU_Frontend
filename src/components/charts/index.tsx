import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
  PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import { talentColor } from '@/utils'
import type { TalentCategory } from '@/types'

// ── Talent Distribution Bar ───────────────────────────────────────────────────
interface DistBarProps {
  data: Array<{ label: string; count: number; percentage: number }>
  height?: number
}

export function TalentDistributionBar({ data, height = 180 }: DistBarProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 80 }}>
        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
          width={76}
        />
        <Tooltip
          formatter={(v: number, _: string, { payload }: any) =>
            [`${v} siswa (${payload.percentage}%)`, 'Jumlah']}
          contentStyle={{
            borderRadius: 10, border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12,
          }}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={talentColor(entry.label as TalentCategory)}
              fillOpacity={0.9}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Talent Distribution Pie ───────────────────────────────────────────────────
interface DistPieProps {
  data: Array<{ name: string; value: number; color: string }>
  height?: number
}

export function TalentDistributionPie({ data, height = 200 }: DistPieProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) => [`${v} siswa`, '']}
          contentStyle={{
            borderRadius: 10, border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12,
          }}
        />
        <Legend
          formatter={(v) => <span style={{ fontSize: 11, color: '#475569' }}>{v}</span>}
          wrapperStyle={{ paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ── Progress Line Chart ───────────────────────────────────────────────────────
interface ProgressLineProps {
  data: Array<Record<string, unknown>>
  aspectKeys: string[]
  aspectLabels: Record<string, string>
  aspectColors: string[]
  xKey?: string
  height?: number
  xFormatter?: (v: string) => string
  tooltipLabelFormatter?: (v: string) => string
}

export function ProgressLineChart({
  data,
  aspectKeys,
  aspectLabels,
  aspectColors,
  xKey = 'date',
  height = 240,
  xFormatter,
  tooltipLabelFormatter,
}: ProgressLineProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey={xKey}
          tickFormatter={xFormatter}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
        />
        <YAxis
          domain={[0, 4]}
          ticks={[1, 2, 3, 4]}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
        />
        <Tooltip
          labelFormatter={tooltipLabelFormatter}
          formatter={(v: number, name: string) => [
            `${v}/4`,
            aspectLabels[name] ?? name,
          ]}
          contentStyle={{
            borderRadius: 10, border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12,
          }}
        />
        <Legend
          formatter={(v) => (
            <span style={{ fontSize: 11, color: '#475569' }}>
              {aspectLabels[v] ?? v}
            </span>
          )}
        />
        {aspectKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={aspectColors[i]}
            strokeWidth={2}
            dot={{ fill: aspectColors[i], r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Model Radar Chart ─────────────────────────────────────────────────────────
interface ModelRadarProps {
  data: Array<{ subject: string; A: number }>
  height?: number
}

export function ModelRadarChart({ data, height = 220 }: ModelRadarProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data}>
        <PolarGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
        <Radar
          name="Model"
          dataKey="A"
          stroke="#2563EB"
          fill="#2563EB"
          fillOpacity={0.15}
          strokeWidth={2}
          dot={{ fill: '#2563EB', r: 4 }}
        />
        <Tooltip
          formatter={(v: number) => `${v.toFixed(1)}%`}
          contentStyle={{
            borderRadius: 10, border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12,
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// ── Activity Bar Chart (daily) ────────────────────────────────────────────────
interface ActivityBarProps {
  data: Array<{ date: string; count: number }>
  height?: number
}

export function ActivityBarChart({ data, height = 120 }: ActivityBarProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 9, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(d) => {
            const date = new Date(d)
            return `${date.getDate()}/${date.getMonth() + 1}`
          }}
        />
        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          formatter={(v: number) => [`${v} observasi`, '']}
          contentStyle={{
            borderRadius: 8, border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 11,
          }}
          labelFormatter={(d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
        />
        <Bar dataKey="count" fill="#2563EB" fillOpacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}
