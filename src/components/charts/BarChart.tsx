import {
  Bar,
  BarChart as RBarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { chartSeries, palette } from '@/theme/tokens'

export interface BarDatum {
  label: string
  value: number
  /** Text shown above the bar (e.g. "$168m"). */
  display: string
}

export interface BarChartProps {
  data: readonly BarDatum[]
  height?: number
  /** Accessible description of what the chart shows. */
  label: string
}

/** Single-series bar chart; bar colours step through the chart palette. */
export function BarChart({ data, height = 220, label }: BarChartProps) {
  return (
    <div role="img" aria-label={label} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <RBarChart data={[...data]} margin={{ top: 24, right: 12, left: 12, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: palette.line }}
            tick={{ fontSize: 11, fill: palette.textSoft }}
            interval={0}
          />
          <YAxis hide />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
            {data.map((datum, index) => (
              <Cell key={datum.label} fill={chartSeries[index % chartSeries.length]} />
            ))}
            <LabelList
              dataKey="display"
              position="top"
              style={{ fontSize: 12, fontWeight: 700, fill: palette.navy }}
            />
          </Bar>
        </RBarChart>
      </ResponsiveContainer>
    </div>
  )
}
