import { useState } from 'react'
import { BarChart } from '@/components/charts'
import { ExportDialog } from '@/components/ExportDialog'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/toastContext'
import {
  FilterBar,
  FilterSelect,
  Button,
  Card,
  CardGrid,
  CardHeader,
  MetricCard,
  PageHeader,
} from '@/components/ui'
import { formatMillions } from '@/lib/format'
import type { DashboardData } from '@/types/domain'
import { useDashboard } from './hooks'

type Measure = 'value' | 'count' | 'risk'
type ChartType = 'bar' | 'cards'

const MEASURES = [
  { value: 'value', label: 'Open value' },
  { value: 'count', label: 'Stage count' },
  { value: 'risk', label: 'Follow-up risk' },
]

const CHART_TYPES = [
  { value: 'bar', label: 'Bar comparison' },
  { value: 'cards', label: 'Side-by-side metric cards' },
]

function measureOf(data: DashboardData, measure: Measure) {
  switch (measure) {
    case 'value':
      return { value: data.openPipeline, display: formatMillions(data.openPipeline) }
    case 'count': {
      const total = data.stages.reduce((sum, stage) => sum + stage.count, 0)
      return { value: total, display: String(total) }
    }
    case 'risk':
      return { value: data.followUpsOverdue, display: String(data.followUpsOverdue) }
  }
}

/** Compares one measure from each pipeline without combining the pipelines. */
export function CustomDashboardPage() {
  const toast = useToast()
  const loan = useDashboard('loan')
  const investment = useDashboard('investment')
  const [loanMeasure, setLoanMeasure] = useState<Measure>('value')
  const [investmentMeasure, setInvestmentMeasure] = useState<Measure>('value')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [exporting, setExporting] = useState(false)

  return (
    <>
      <PageHeader
        title="Custom comparison dashboard"
        description="Compare selected Loan and Investment Opportunity measures without combining their operational pipelines."
        actions={
          <Button
            variant="primary"
            onClick={() => toast.success('Custom dashboard saved for your user role')}
          >
            Save dashboard
          </Button>
        }
      />
      <QueryState query={loan}>
        {(loanData) => (
          <QueryState query={investment}>
            {(investmentData) => {
              const a = measureOf(loanData, loanMeasure)
              const b = measureOf(investmentData, investmentMeasure)
              const rows = [
                { label: 'Loan Opportunities', ...a },
                { label: 'Investment Opportunities', ...b },
              ]
              return (
                <Card padded>
                  <FilterBar>
                    <FilterSelect
                      value={loanMeasure}
                      onChange={(v) => setLoanMeasure((v || 'value') as Measure)}
                      options={MEASURES.map((m) => ({
                        value: m.value,
                        label: `Loan Opportunities: ${m.label}`,
                      }))}
                      allLabel="Loan Opportunities: Open value"
                    />
                    <FilterSelect
                      value={investmentMeasure}
                      onChange={(v) => setInvestmentMeasure((v || 'value') as Measure)}
                      options={MEASURES.map((m) => ({
                        value: m.value,
                        label: `Investment Opportunities: ${m.label}`,
                      }))}
                      allLabel="Investment Opportunities: Open value"
                    />
                    <FilterSelect
                      value={chartType}
                      onChange={(v) => setChartType((v || 'bar') as ChartType)}
                      options={CHART_TYPES}
                      allLabel="Bar comparison"
                    />
                  </FilterBar>

                  <CardGrid columns={2}>
                    <Card padded>
                      <CardHeader title="Comparison" />
                      {chartType === 'bar' ? (
                        <BarChart label="Comparison of selected measures" data={rows} />
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {rows.map((row) => (
                            <MetricCard
                              key={row.label}
                              icon="#"
                              label={row.label}
                              value={row.display}
                            />
                          ))}
                        </div>
                      )}
                    </Card>
                    <Card padded>
                      <CardHeader
                        title="Comparison settings"
                        description="This user-created dashboard can compare values, stage counts and follow-up risk from both pipelines."
                      />
                      <Button onClick={() => setExporting(true)}>Export selected data</Button>
                    </Card>
                  </CardGrid>
                  <ExportDialog
                    open={exporting}
                    subject="Comparison"
                    rows={rows.map((row) => ({ pipeline: row.label, value: row.value }))}
                    onClose={() => setExporting(false)}
                  />
                </Card>
              )
            }}
          </QueryState>
        )}
      </QueryState>
    </>
  )
}
