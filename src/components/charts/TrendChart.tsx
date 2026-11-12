import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { palette } from '@/theme/tokens'

export interface TrendSeries {
  key: string
  label: string
  color: string
  dashed?: boolean
}

export interface TrendChartProps {
  data: readonly Record<string, string | number>[]
  xKey: string
  series: readonly TrendSeries[]
  height?: number
  label: string
}

/** Multi-series line chart with a legend rendered below. */
export function TrendChart({ data, xKey, series, height = 185, label }: TrendChartProps) {
  return (
    <div>
      <div role="img" aria-label={label} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={[...data]} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={palette.lineSoft} vertical={false} />
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: palette.textSoft }}
            />
            <YAxis
              width={28}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: palette.textSoft }}
            />
            <Tooltip />
            {series.map((s) => (
              <Line
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={3}
                strokeDasharray={s.dashed ? '7 6' : undefined}
                dot={{ r: 4, fill: s.color }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="text-muted m-0 mt-2 flex list-none flex-wrap gap-5 p-0 text-xs">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <i
              className="size-[9px] rounded-full"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
