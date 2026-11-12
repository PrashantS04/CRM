import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import { AlertTriangle, CheckSquare, DollarSign } from 'lucide-react'
import { useState } from 'react'
import { BarChart, DonutChart, TrendChart } from '@/components/charts'
import { ExportDialog } from '@/components/ExportDialog'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/toastContext'
import {
  Button,
  Card,
  CardGrid,
  CardHeader,
  ButtonLink,
  MetricCard,
  PageHeader,
} from '@/components/ui'
import { OPPORTUNITY_KINDS } from '@/features/opportunities/config'
import { useOpportunities } from '@/features/opportunities/hooks'
import { usePersistentState } from '@/hooks/usePersistentState'
import { countBy } from '@/lib/collections'
import { formatMillions } from '@/lib/format'
import { palette } from '@/theme/tokens'
import type { OpportunityKind } from '@/types/domain'
import { DEFAULT_CHART_PREFS, type ChartPrefs } from './chartPrefs'
import { CustomizeChartsDialog } from './CustomizeChartsDialog'
import { useDashboard } from './hooks'

export const LoanDashboardPage = () => <PipelineDashboardPage kind="loan" />
export const InvestmentDashboardPage = () => <PipelineDashboardPage kind="investment" />

function PipelineDashboardPage({ kind }: { kind: OpportunityKind }) {
  const config = OPPORTUNITY_KINDS[kind]
  const toast = useToast()
  const dashboard = useDashboard(kind)
  const opportunities = useOpportunities(kind)
  const [prefs, setPrefs] = usePersistentState<ChartPrefs>(
    `pi.dashboard.charts.${kind}`,
    DEFAULT_CHART_PREFS,
  )
  const [role, setRole] = useState<string>(config.roles[0])
  const [customizing, setCustomizing] = useState(false)
  const [exporting, setExporting] = useState(false)

  const ownerWorkload = countBy(opportunities.data ?? [], (o) => o.owner).map(([label, count]) => ({
    label,
    value: count,
    display: String(count),
  }))

  return (
    <>
      <PageHeader
        title={`${config.plural} dashboard`}
        description={
          kind === 'loan'
            ? 'Role-scoped dashboard for Credit teams and Loan Opportunity oversight.'
            : 'Role-scoped dashboard for Investor Relations and Investment Opportunity oversight.'
        }
        actions={
          <>
            <Select
              value={role}
              size="small"
              inputProps={{ 'aria-label': 'Dashboard role' }}
              onChange={(event) => {
                setRole(event.target.value)
                toast.info(
                  'Access is role-scoped. Selected role sees only its permitted dashboard.',
                )
              }}
            >
              {config.roles.map((name) => (
                <MenuItem key={name} value={name}>
                  {name} role
                </MenuItem>
              ))}
            </Select>
            <Button onClick={() => setCustomizing(true)}>Customize charts</Button>
            <Button onClick={() => setExporting(true)}>Export</Button>
          </>
        }
      />

      <QueryState query={dashboard}>
        {(data) => (
          <>
            <CardGrid>
              <MetricCard
                icon={<DollarSign size={21} />}
                label="Open pipeline"
                value={formatMillions(data.openPipeline)}
                link={{ label: 'View opportunities', to: config.basePath }}
              />
              <MetricCard
                icon={<AlertTriangle size={21} />}
                label="Follow-ups overdue"
                accent="teal"
                value={data.followUpsOverdue}
                link={{
                  label: 'Open follow-up queue',
                  onClick: () => toast.info('Follow-up queue opened'),
                }}
              />
              <MetricCard
                icon={<CheckSquare size={21} />}
                label="My open tasks"
                accent="gold"
                value={data.openTasks}
                link={{ label: 'View tasks', to: '/tasks' }}
              />
            </CardGrid>

            <CardGrid columns={2}>
              {prefs.stage && (
                <Card padded>
                  <CardHeader
                    title="Pipeline stage value"
                    description="Open value by current stage."
                    action={
                      <ButtonLink to={config.basePath} variant="link">
                        View opportunities
                      </ButtonLink>
                    }
                  />
                  <BarChart
                    label={`Open value by stage for ${config.plural}`}
                    data={data.stages.map((s) => ({
                      label: s.stage,
                      value: s.value,
                      display: formatMillions(s.value),
                    }))}
                  />
                </Card>
              )}
              {prefs.health && (
                <Card padded>
                  <CardHeader
                    title="Pipeline health"
                    description="Follow-up status across active opportunities."
                  />
                  <DonutChart
                    centerValue={String(
                      data.health.onTrack + data.health.dueSoon + data.health.overdue,
                    )}
                    centerLabel="open"
                    data={[
                      { label: 'On track', value: data.health.onTrack, color: palette.chart1 },
                      { label: 'Due soon', value: data.health.dueSoon, color: palette.chart5 },
                      { label: 'Overdue', value: data.health.overdue, color: palette.brand },
                    ]}
                  />
                </Card>
              )}
              {prefs.owners && (
                <Card padded>
                  <CardHeader title="Owner workload" description="Open opportunities per owner." />
                  <BarChart
                    label={`Opportunities per owner for ${config.plural}`}
                    data={ownerWorkload}
                  />
                </Card>
              )}
            </CardGrid>

            {prefs.trend && (
              <Card padded>
                <CardHeader
                  title="New opportunities trend"
                  description="Created opportunities by week."
                />
                <TrendChart
                  label="New opportunities and completed follow-ups by week"
                  data={data.trend}
                  xKey="week"
                  series={[
                    { key: 'created', label: 'New opportunities', color: palette.chart1 },
                    {
                      key: 'followUpsCompleted',
                      label: 'Follow-ups completed',
                      color: palette.chart5,
                      dashed: true,
                    },
                  ]}
                />
              </Card>
            )}

            <CustomizeChartsDialog
              open={customizing}
              title={config.plural}
              prefs={prefs}
              onSave={(next) => {
                setPrefs(next)
                toast.success('Dashboard layout saved for this role')
              }}
              onClose={() => setCustomizing(false)}
            />
            <ExportDialog
              open={exporting}
              subject={config.plural}
              rows={data.stages.map((s) => ({
                stage: s.stage,
                opportunities: s.count,
                value: s.value,
              }))}
              onClose={() => setExporting(false)}
            />
          </>
        )}
      </QueryState>
    </>
  )
}
