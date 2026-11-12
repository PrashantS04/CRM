import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

export interface DonutDatum {
  label: string
  value: number
  color: string
}

export interface DonutChartProps {
  data: readonly DonutDatum[]
  centerValue: string
  centerLabel: string
  size?: number
}

/** Donut with the total in the centre and an adjacent legend list. */
export function DonutChart({ data, centerValue, centerLabel, size = 150 }: DonutChartProps) {
  const summary = data.map((d) => `${d.label}: ${d.value}`).join(', ')
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div
        role="img"
        aria-label={`${centerLabel} ${centerValue}. ${summary}`}
        className="relative shrink-0"
        style={{ width: size, height: size }}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={[...data]}
              dataKey="value"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.label} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-navy font-extrabold">{centerValue}</div>
            <small className="text-muted block text-[9px]">{centerLabel}</small>
          </div>
        </div>
      </div>
      <ul className="m-0 grid list-none gap-2 p-0">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2 text-xs">
            <i
              className="size-[9px] rounded-full"
              style={{ backgroundColor: d.color }}
              aria-hidden
            />
            <span>{d.label}</span>
            <b className="ml-auto pl-4">{d.value}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}
