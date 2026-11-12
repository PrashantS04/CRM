import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExportDialog } from '@/components/ExportDialog'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/toastContext'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import {
  Button,
  ButtonLink,
  Card,
  CardHeader,
  DataTable,
  FilterBar,
  FilterSelect,
  PageHeader,
  RecordLink,
  SearchInput,
  SegmentedControl,
  type Column,
} from '@/components/ui'
import { LEAD_CATEGORIES, LEAD_STATUSES, OWNERS } from '@/constants/lists'
import { usePersistentState } from '@/hooks/usePersistentState'
import { formatCurrency } from '@/lib/format'
import type { Opportunity, OpportunityKind } from '@/types/domain'
import { detailPath, OPPORTUNITY_KINDS } from './config'
import { useMoveOpportunityStage, useOpportunities, usePipelines } from './hooks'
import { NewOpportunityDialog } from './NewOpportunityDialog'
import { OpportunityCard } from './OpportunityCard'

type View = 'kanban' | 'list'
const VIEW_OPTIONS = [
  { value: 'list', label: 'List' },
  { value: 'kanban', label: 'Kanban' },
] as const

const SCROLL_STEP = 600

export const LoanOpportunitiesPage = () => <OpportunitiesPage kind="loan" />
export const InvestmentOpportunitiesPage = () => <OpportunitiesPage kind="investment" />

function OpportunitiesPage({ kind }: { kind: OpportunityKind }) {
  const config = OPPORTUNITY_KINDS[kind]
  const navigate = useNavigate()
  const toast = useToast()
  const opportunities = useOpportunities(kind)
  const pipelines = usePipelines()
  const move = useMoveOpportunityStage(kind)
  const [view, setView] = usePersistentState<View>('pi.opportunities.view', 'kanban')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [leadStatus, setLeadStatus] = useState('')
  const [owner, setOwner] = useState('')
  const [creating, setCreating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const stages = pipelines.data?.find((p) => p.id === config.pipelineId)?.stages ?? []

  const columns = useMemo<Column<Opportunity>[]>(
    () => [
      {
        key: 'name',
        header: 'Opportunity',
        cell: (o) => <RecordLink to={detailPath(o.kind, o.id)}>{o.name}</RecordLink>,
      },
      { key: 'category', header: 'Lead category', cell: (o) => o.leadCategory },
      { key: 'leadStatus', header: 'Lead status', cell: (o) => o.leadStatus },
      { key: 'stage', header: 'Stage', cell: (o) => o.stage },
      { key: 'owner', header: 'Owner', cell: (o) => o.owner },
      { key: 'amount', header: 'Amount', cell: (o) => formatCurrency(o.amount) },
    ],
    [],
  )

  return (
    <>
      <PageHeader
        title={config.plural}
        description="Leads progress from suspect to prospect, then through a configurable, scrollable opportunity pipeline."
        actions={
          <>
            <ButtonLink to={config.dashboardPath}>{config.plural} dashboard</ButtonLink>
            <Button onClick={() => setExporting(true)}>Export</Button>
            <Button
              variant="primary"
              startIcon={<Plus size={16} />}
              onClick={() => setCreating(true)}
            >
              New {config.short} Opportunity
            </Button>
          </>
        }
      />
      <QueryState query={opportunities}>
        {(all) => {
          const term = search.trim().toLowerCase()
          const rows = all.filter(
            (o) =>
              (!category || o.leadCategory === category) &&
              (!leadStatus || o.leadStatus === leadStatus) &&
              (!owner || o.owner === owner) &&
              (!term || `${o.name} ${o.party}`.toLowerCase().includes(term)),
          )
          return (
            <>
              <FilterBar>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search opportunities"
                />
                <FilterSelect
                  value={category}
                  onChange={setCategory}
                  options={LEAD_CATEGORIES}
                  allLabel="All lead categories"
                />
                <FilterSelect
                  value={leadStatus}
                  onChange={setLeadStatus}
                  options={LEAD_STATUSES}
                  allLabel="All lead statuses"
                />
                <FilterSelect
                  value={owner}
                  onChange={setOwner}
                  options={OWNERS}
                  allLabel="All owners"
                />
                <Button
                  onClick={() =>
                    toast.info(
                      'Advanced filters: sector, amount, follow-up status and days in stage',
                    )
                  }
                >
                  More filters
                </Button>
                <SegmentedControl
                  className="sm:ml-auto"
                  label="View"
                  value={view}
                  onChange={setView}
                  options={VIEW_OPTIONS}
                />
              </FilterBar>

              {view === 'list' ? (
                <>
                  <DataTable
                    label={config.plural}
                    columns={columns}
                    rows={rows}
                    getRowId={(o) => o.id}
                    onRowClick={(o) => navigate(detailPath(o.kind, o.id))}
                    emptyMessage="No opportunities match these filters."
                    minWidth={980}
                    resizable
                  />
                  <p className="text-muted mt-3 text-[13px]">
                    Drag the right edge of any column heading to resize it in your browser.
                  </p>
                </>
              ) : (
                <Card padded>
                  <CardHeader
                    title="Kanban board"
                    description={`${stages.length} stages. Use the arrows or the horizontal scroll bar to see more stages.`}
                    action={
                      <>
                        <Button
                          startIcon={<ChevronLeft size={16} />}
                          onClick={() =>
                            scrollRef.current?.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' })
                          }
                        >
                          Previous stages
                        </Button>
                        <Button
                          endIcon={<ChevronRight size={16} />}
                          onClick={() =>
                            scrollRef.current?.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' })
                          }
                        >
                          Next stages
                        </Button>
                      </>
                    }
                  />
                  <KanbanBoard
                    label={`${config.plural} board`}
                    scrollRef={scrollRef}
                    columns={stages.map((stage) => ({ id: stage, title: stage }))}
                    items={rows}
                    getItemId={(o) => o.id}
                    getItemColumn={(o) => o.stage}
                    renderCard={(o) => <OpportunityCard opportunity={o} />}
                    onMove={(id, stage) => move.mutate({ id, stage })}
                  />
                </Card>
              )}

              <ExportDialog
                open={exporting}
                subject={config.plural}
                rows={rows.map((o) => ({
                  name: o.name,
                  party: o.party,
                  stage: o.stage,
                  owner: o.owner,
                  amount: o.amount,
                  leadCategory: o.leadCategory,
                  leadStatus: o.leadStatus,
                }))}
                onClose={() => setExporting(false)}
              />
            </>
          )
        }}
      </QueryState>
      <NewOpportunityDialog kind={kind} open={creating} onClose={() => setCreating(false)} />
    </>
  )
}
