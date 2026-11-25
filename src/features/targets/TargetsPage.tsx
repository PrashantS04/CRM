import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/feedback/toastContext'
import { Badge, Button, Card, CardHeader, DataTable, FormDialog, PageHeader, type Column } from '@/components/ui'
import { CURRENT_USER, OWNERS } from '@/constants/lists'
import { cn } from '@/lib/cn'
import { FormField } from '@/components/form'

interface TargetKpi {
  label: string
  achieved: string
  target: string
  pct: number
}

const KPIS: TargetKpi[] = [
  { label: 'Qualified leads', achieved: '18', target: '25', pct: 72 },
  { label: 'Calls completed', achieved: '42', target: '50', pct: 84 },
  { label: 'Meetings completed', achieved: '16', target: '20', pct: 80 },
  { label: 'Won / closed leads', achieved: '6', target: '8', pct: 75 },
]

interface UserTargetRow {
  user: string
  role: string
  leads: string
  calls: string
  meetings: string
  won: string
  overall: string
}

const USER_ROWS: UserTargetRow[] = [
  { user: 'Alex Stewart', role: 'Credit Manager', leads: '7 / 10', calls: '18 / 20', meetings: '6 / 8', won: '3 / 4', overall: '78%' },
  { user: 'Sarah Chen', role: 'Credit Manager', leads: '6 / 8', calls: '14 / 18', meetings: '5 / 6', won: '2 / 3', overall: '76%' },
  { user: 'J. Davies', role: 'Investor Relations', leads: '5 / 7', calls: '10 / 12', meetings: '5 / 6', won: '1 / 1', overall: '83%' },
]

interface HistoryRow {
  period: string
  leads: string
  calls: string
  meetings: string
  overall: string
  tone: 'brand' | 'neutral'
}

const HISTORY: HistoryRow[] = [
  { period: 'August 2026', leads: 'Qualified leads: 8 / 10', calls: 'Calls: 21 / 20', meetings: 'Meetings: 7 / 8', overall: '90%', tone: 'brand' },
  { period: 'September 2026', leads: 'Qualified leads: 9 / 10', calls: 'Calls: 17 / 20', meetings: 'Meetings: 8 / 8', overall: '88%', tone: 'brand' },
  { period: 'October 2026', leads: 'Qualified leads: 6 / 10', calls: 'Calls: 19 / 20', meetings: 'Meetings: 5 / 8', overall: '76%', tone: 'neutral' },
  { period: 'November 2026', leads: 'Qualified leads: 7 / 10', calls: 'Calls: 18 / 20', meetings: 'Meetings: 6 / 8', overall: '78%', tone: 'brand' },
]

const USER_COLUMNS: Column<UserTargetRow>[] = [
  {
    key: 'user',
    header: 'User',
    cell: (r) => (
      <>
        <b>{r.user}</b>
        <br />
        <small className="text-muted">{r.role}</small>
      </>
    ),
  },
  { key: 'leads', header: 'Qualified leads', cell: (r) => r.leads },
  { key: 'calls', header: 'Calls', cell: (r) => r.calls },
  { key: 'meetings', header: 'Meetings', cell: (r) => r.meetings },
  { key: 'won', header: 'Won / closed', cell: (r) => r.won },
  { key: 'overall', header: 'Overall', cell: (r) => <Badge tone="brand">{r.overall}</Badge> },
]

interface MetricRow {
  id: number
  activity: string
  result: string
  target: string
}

const ACTIVITIES = ['Opportunities', 'Calls', 'Meetings', 'Emails', 'Tasks'] as const
const RESULTS = ['Enquiry', 'Prospect', 'Verified', 'Won / Closed won', 'Scheduled', 'Completed', 'Client replied'] as const

export function TargetsPage() {
  const toast = useToast()
  const [period, setPeriod] = useState('This month')
  const [settingTarget, setSettingTarget] = useState(false)

  return (
    <>
      <PageHeader
        title="Targets"
        description="Set activity targets for users and monitor system-calculated achievement from CRM activity."
        actions={
          <Button variant="primary" startIcon={<Plus size={16} />} onClick={() => setSettingTarget(true)}>
            Set new target
          </Button>
        }
      />

      <Card padded className="mb-4">
        <CardHeader
          title="Team target dashboard"
          description="Live totals are calculated from linked CRM activities, opportunity stages and client responses."
          action={
            <label className="text-muted flex items-center gap-1.5 text-xs font-bold">
              Period
              <Select value={period} onChange={(e) => setPeriod(e.target.value)} size="small" sx={{ width: 130 }} inputProps={{ 'aria-label': 'Period' }}>
                {['This week', 'This month', 'Last month', 'This quarter'].map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </label>
          }
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="border-line rounded-card border bg-surface p-4">
              <small className="text-muted block text-xs font-bold">{kpi.label}</small>
              <b className="my-1.5 block text-2xl">
                {kpi.achieved} <span className="text-base text-muted">/ {kpi.target}</span>
              </b>
              <em className="text-teal-text not-italic text-[11px] font-extrabold">{kpi.pct}% achieved</em>
              <div className="bg-line-strong mt-2 h-2 overflow-hidden rounded-full">
                <i className="bg-teal-text block h-full rounded-full" style={{ width: `${kpi.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <div className="grid content-start gap-4">
          <Card padded>
            <CardHeader
              title="User targets and progress"
              description="Current achievement per user for the selected period."
              action={<Button onClick={() => toast.info('Target list export recorded')}>Export list</Button>}
            />
            <DataTable label="User targets" columns={USER_COLUMNS} rows={USER_ROWS} getRowId={(r) => r.user} minWidth={640} />
          </Card>

          <Card padded>
            <CardHeader
              title="Historic achievement"
              description={`${CURRENT_USER} · activity history against the saved target.`}
              action={
                <Select defaultValue="All activity types" size="small" sx={{ width: 160 }} inputProps={{ 'aria-label': 'Activity type' }}>
                  {['All activity types', 'Qualified leads', 'Calls', 'Meetings'].map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </Select>
              }
            />
            {HISTORY.map((row) => (
              <div
                key={row.period}
                className="border-line-soft grid grid-cols-[130px_repeat(4,1fr)] items-center gap-2 border-b py-2.5 text-xs last:border-0"
              >
                <b>{row.period}</b>
                <span>{row.leads}</span>
                <span>{row.calls}</span>
                <span>{row.meetings}</span>
                <Badge tone={row.tone}>{row.overall}</Badge>
              </div>
            ))}
          </Card>
        </div>

        <Card padded>
          <CardHeader
            title="Activity targets"
            description={`${CURRENT_USER} · November 2026`}
            action={<Button onClick={() => setSettingTarget(true)}>Edit</Button>}
          />
          <p className="text-muted m-0 mb-3 text-xs">
            Only the measures selected for this user are tracked. Users do not need a target for
            every activity.
          </p>
          {[
            { name: 'Opportunities', rule: 'Count when stage is Verified', value: '7 / 10 achieved' },
            { name: 'Calls', rule: 'Count when status is Completed', value: '18 / 20 achieved' },
            { name: 'Meetings', rule: 'Count when status is Scheduled', value: '6 / 8 achieved' },
          ].map((t, i) => (
            <div key={t.name} className={cn('py-3', i > 0 && 'border-line-soft border-t')}>
              <b>{t.name}</b>
              <br />
              <small className="text-muted">{t.rule}</small>
              <div className="mt-1.5">
                <Badge tone="brand">{t.value}</Badge>
              </div>
            </div>
          ))}
          <Button variant="primary" className="mt-3.5 w-full" onClick={() => setSettingTarget(true)}>
            + Add activity target
          </Button>
          <div className="border-l-teal-text bg-teal-soft mt-3.5 rounded-md border-l-[3px] p-3 text-[11px] leading-snug text-text-soft">
            <b>Automatic CRM mapping</b>
            <br />
            CRM activity updates and opportunity stage changes update each matching target
            automatically.
          </div>
        </Card>
      </div>

      <SetTargetDialog open={settingTarget} onClose={() => setSettingTarget(false)} />
    </>
  )
}

function MetricRowEditor({ row, onChange, onRemove }: { row: MetricRow; onChange: (r: MetricRow) => void; onRemove: () => void }) {
  const sx = { minWidth: 0, width: '100%' } as const
  return (
    <div className="border-line bg-canvas grid grid-cols-[1.1fr_1.1fr_0.6fr_34px] items-end gap-2.5 rounded-[10px] border p-3">
      <FormField id={`act-${row.id}`} label="Activity">
        <Select value={row.activity} onChange={(e) => onChange({ ...row, activity: e.target.value })} fullWidth size="small" sx={sx} inputProps={{ 'aria-label': 'Activity' }}>
          {ACTIVITIES.map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </Select>
      </FormField>
      <FormField id={`res-${row.id}`} label="Count when">
        <Select value={row.result} onChange={(e) => onChange({ ...row, result: e.target.value })} fullWidth size="small" sx={sx} inputProps={{ 'aria-label': 'Count when' }}>
          {RESULTS.map((r) => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </Select>
      </FormField>
      <FormField id={`num-${row.id}`} label="Target number">
        <TextField fullWidth size="small" type="number" defaultValue={row.target} onChange={(e) => onChange({ ...row, target: e.target.value })} slotProps={{ htmlInput: { min: 1 } }} />
      </FormField>
      <Button variant="ghost" size="small" aria-label="Remove activity target" onClick={onRemove} sx={{ minWidth: 34, px: 0 }}>
        <Trash2 size={15} />
      </Button>
    </div>
  )
}

function SetTargetDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const [user, setUser] = useState<string>(CURRENT_USER)
  const [period, setPeriod] = useState('November 2026')
  const [rows, setRows] = useState<MetricRow[]>([
    { id: 1, activity: 'Opportunities', result: 'Verified', target: '10' },
    { id: 2, activity: 'Calls', result: 'Completed', target: '20' },
    { id: 3, activity: 'Meetings', result: 'Scheduled', target: '8' },
  ])
  const sx = { minWidth: 0, width: '100%' } as const
  const update = (id: number, patch: Partial<MetricRow>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  return (
    <FormDialog
      open={open}
      title="Set activity targets"
      description="Choose only the activities and qualifying results relevant to this user. Add another target only when needed."
      submitLabel="Save targets"
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault()
        toast.success(`Targets saved for ${user} · ${period}`)
        onClose()
      }}
    >
      <FormField id="tg-user" label="Set target for">
        <Select value={user} onChange={(e) => setUser(e.target.value)} fullWidth size="small" sx={sx} inputProps={{ 'aria-label': 'Set target for' }}>
          {OWNERS.map((o) => (
            <MenuItem key={o} value={o}>
              {o}
              {o === CURRENT_USER ? ' (me)' : ' — direct report'}
            </MenuItem>
          ))}
        </Select>
      </FormField>
      <FormField id="tg-period" label="Period">
        <Select value={period} onChange={(e) => setPeriod(e.target.value)} fullWidth size="small" sx={sx} inputProps={{ 'aria-label': 'Period' }}>
          {['November 2026', 'December 2026', 'Q4 2026'].map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </Select>
      </FormField>
      <div className="col-span-full">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <b>Activity targets</b>
            <p className="text-muted m-0 mt-0.5 text-xs">Each row is independently mapped to CRM activity or opportunity data.</p>
          </div>
          <Button size="small" onClick={() => setRows((rs) => [...rs, { id: Date.now(), activity: 'Calls', result: 'Completed', target: '10' }])}>
            + Add activity target
          </Button>
        </div>
        <div className="grid gap-2">
          {rows.map((row) => (
            <MetricRowEditor key={row.id} row={row} onChange={(r) => update(r.id, r)} onRemove={() => setRows((rs) => rs.filter((x) => x.id !== row.id))} />
          ))}
        </div>
        <div className="border-l-teal-text bg-teal-soft mt-3.5 rounded-md border-l-[3px] p-3 text-[11px] leading-snug text-text-soft">
          <b>Automatic calculation</b>
          <br />
          Achievement is calculated by the system from CRM activity — it is never entered by hand.
        </div>
      </div>
    </FormDialog>
  )
}
