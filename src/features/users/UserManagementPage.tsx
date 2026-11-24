import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import { Download, Plus } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/feedback/toastContext'
import { FormField } from '@/components/form'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  FormDialog,
  PageHeader,
  Tabs,
  type Column,
} from '@/components/ui'
import { OWNERS } from '@/constants/lists'
import { cn } from '@/lib/cn'

const OBJECTS = [
  'People',
  'Entities',
  'Loan Opportunities',
  'Investment Opportunities',
  'Tasks',
  'Calendar',
  'Reports',
  'Field configuration',
] as const
const PERMISSIONS = ['View', 'Create', 'Update', 'Delete', 'Export'] as const

interface RoleRow {
  name: string
  users: string
  scope: string
  authority: string
}

const ROLES: RoleRow[] = [
  { name: 'Administrator', users: 'Alex Stewart', scope: 'All CRM objects', authority: 'Self and any user' },
  { name: 'Credit Manager', users: 'Sarah Chen', scope: 'Loan, People, Entities, Tasks', authority: 'Self and direct reports' },
  { name: 'Investor Relations', users: 'J. Davies', scope: 'Investment, People, Entities, Tasks', authority: 'Self and direct reports' },
]

interface UserRow {
  name: string
  email: string
  role: string
  manager: string
  authority: string
  status: string
}

const USERS: UserRow[] = [
  { name: 'Alex Stewart', email: 'alex.stewart@privateinvest.com', role: 'Administrator', manager: 'No manager', authority: 'Self and any user', status: 'Active' },
  { name: 'Sarah Chen', email: 'sarah.chen@privateinvest.com', role: 'Credit Manager', manager: 'Alex Stewart', authority: 'Self and direct reports', status: 'Active' },
  { name: 'J. Davies', email: 'j.davies@privateinvest.com', role: 'Investor Relations', manager: 'Alex Stewart', authority: 'Self and direct reports', status: 'Active' },
  { name: 'M. Khan', email: 'm.khan@privateinvest.com', role: 'Investor Relations', manager: 'Alex Stewart', authority: 'Self only', status: 'Active' },
]

interface AuditRow {
  when: string
  by: string
  change: string
  record: string
  previous: string
  next: string
  status: string
}

const AUDIT: AuditRow[] = [
  { when: '19 Nov 2026, 10:42', by: 'Alex Stewart', change: 'Target authority updated', record: 'Credit Manager', previous: 'Self only', next: 'Self and direct reports', status: 'Applied' },
  { when: '18 Nov 2026, 16:18', by: 'Alex Stewart', change: 'Role assigned', record: 'Sarah Chen', previous: 'Relationship Manager', next: 'Credit Manager', status: 'Applied' },
  { when: '17 Nov 2026, 11:05', by: 'Sarah Chen', change: 'Export permission changed', record: 'Loan Opportunities', previous: 'Export denied', next: 'Export permitted', status: 'Applied' },
  { when: '15 Nov 2026, 09:31', by: 'Alex Stewart', change: 'User invited and activated', record: 'J. Davies', previous: 'Not provisioned', next: 'Investor Relations', status: 'Applied' },
  { when: '12 Nov 2026, 14:52', by: 'Alex Stewart', change: 'Delete permission removed', record: 'Tasks', previous: 'Delete permitted', next: 'Archive only', status: 'Applied' },
]

type Section = 'roles' | 'users' | 'audit'
const SECTIONS = [
  { value: 'users', label: 'Users' },
  { value: 'roles', label: 'Roles and permissions' },
  { value: 'audit', label: 'Permission audit' },
] as const

const ROLE_COLUMNS: Column<RoleRow>[] = [
  { key: 'name', header: 'Role', cell: (r) => <b>{r.name}</b> },
  { key: 'users', header: 'Assigned users', cell: (r) => r.users },
  { key: 'scope', header: 'Object scope', cell: (r) => r.scope },
  {
    key: 'authority',
    header: 'Target authority',
    cell: (r) => <Badge tone={r.authority === 'Self and any user' ? 'brand' : 'neutral'}>{r.authority}</Badge>,
  },
  { key: 'edit', header: '', cell: () => <Button size="small">Edit</Button> },
]

const AUDIT_COLUMNS: Column<AuditRow>[] = [
  { key: 'when', header: 'Date and time', cell: (r) => r.when },
  { key: 'by', header: 'Changed by', cell: (r) => <b>{r.by}</b> },
  { key: 'change', header: 'Change', cell: (r) => r.change },
  { key: 'record', header: 'Record / role', cell: (r) => r.record },
  { key: 'previous', header: 'Previous value', cell: (r) => r.previous },
  { key: 'next', header: 'New value', cell: (r) => r.next },
  { key: 'status', header: 'Status', cell: (r) => <Badge tone="brand">{r.status}</Badge> },
]

function managerOptions(user: UserRow): string[] {
  if (user.manager === 'No manager' || user.name === 'Alex Stewart') {
    return ['No manager', 'Board / system owner']
  }
  return [...USERS.filter((u) => u.name !== user.name).map((u) => u.name), 'No manager']
}

export function UserManagementPage() {
  const toast = useToast()
  const [section, setSection] = useState<Section>('users')
  const [creatingRole, setCreatingRole] = useState(false)
  const [addingUser, setAddingUser] = useState(false)
  const [managers, setManagers] = useState<Record<string, string>>({})
  const [matrix, setMatrix] = useState<Record<string, boolean[]>>(() =>
    Object.fromEntries(OBJECTS.map((o) => [o, [true, true, true, o !== 'Field configuration', o !== 'Field configuration']])),
  )
  const [authority, setAuthority] = useState([true, true, true])

  const managerOf = (u: UserRow) => managers[u.name] ?? u.manager
  const directReports = (name: string) => USERS.filter((u) => managerOf(u) === name)

  const userColumns: Column<UserRow>[] = [
    { key: 'name', header: 'User', cell: (r) => <b>{r.name}</b> },
    { key: 'email', header: 'Email', cell: (r) => r.email },
    { key: 'role', header: 'Assigned role', cell: (r) => r.role },
    {
      key: 'manager',
      header: 'Reports to',
      cell: (r) => (
        <Select
          value={managerOf(r)}
          onChange={(e) => setManagers((m) => ({ ...m, [r.name]: e.target.value }))}
          size="small"
          sx={{ minWidth: 150 }}
          inputProps={{ 'aria-label': `Reporting manager for ${r.name}` }}
        >
          {managerOptions(r).map((o) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </Select>
      ),
    },
    { key: 'authority', header: 'Target authority', cell: (r) => r.authority },
    { key: 'status', header: 'Status', cell: (r) => <Badge tone="success">{r.status}</Badge> },
    { key: 'edit', header: 'Actions', cell: () => <Button size="small">Edit</Button> },
  ]

  const toggleCell = (object: string, index: number) =>
    setMatrix((m) => ({ ...m, [object]: m[object]!.map((v, i) => (i === index ? !v : v)) }))

  return (
    <>
      {section === 'users' && (
        <PageHeader
          title="Users"
          description="Create users, assign roles and define each person's reporting manager."
          actions={
            <Button variant="primary" startIcon={<Plus size={16} />} onClick={() => setAddingUser(true)}>
              Add new user
            </Button>
          }
        />
      )}
      {section === 'roles' && (
        <PageHeader
          title="Roles and permissions"
          description="Create a role and configure its object and target permissions."
          actions={
            <Button variant="primary" startIcon={<Plus size={16} />} onClick={() => setCreatingRole(true)}>
              Create role
            </Button>
          }
        />
      )}
      {section === 'audit' && (
        <PageHeader
          title="Permission audit"
          description="Role, permission, target authority and user changes."
          actions={
            <Button startIcon={<Download size={15} />} onClick={() => toast.success('Audit export recorded')}>
              Export audit
            </Button>
          }
        />
      )}
      <Tabs label="User management sections" value={section} onChange={setSection} items={SECTIONS} />

      {section === 'users' && (
        <>
          <Card padded className="mb-4">
            <CardHeader
              title="Reporting structure"
              description="Reporting lines determine who is a direct report for team target setting and manager-level visibility."
              action={
                <Button onClick={() => toast.success('Reporting lines saved with an audit entry')}>Save reporting lines</Button>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {USERS.map((u) => {
                const reports = directReports(u.name)
                const manager = managerOf(u)
                return (
                  <div key={u.name} className="border-line rounded-[9px] border bg-canvas p-3.5">
                    <b>{u.name}</b>
                    <br />
                    <small className="text-muted">
                      {u.role} · {manager === 'No manager' ? 'No manager' : `reports to ${manager}`}
                    </small>
                    {reports.length > 0 && (
                      <div className="border-brand mt-2 ml-3 border-l-2 pl-3 text-xs leading-[1.8]">
                        {reports.map((r) => (
                          <div key={r.name}>↳ {r.name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          <Card padded>
            <CardHeader
              title="User directory"
              description="Manage a user's role, direct manager, access state and target-setting authority."
            />
            <DataTable label="User directory" columns={userColumns} rows={USERS} getRowId={(r) => r.email} minWidth={980} />
            <p className="text-muted m-0 mt-3.5 text-xs">
              A reporting line is organisational information; it does not automatically grant CRM permissions. Roles and permission
              sets continue to control access.
            </p>
          </Card>
        </>
      )}

      {section === 'roles' && (
        <>
          <Card padded className="mb-4">
            <CardHeader
              title="Roles"
              description="Select a role to define its permission set."
              action={<Badge tone="brand">Administrator selected</Badge>}
            />
            <DataTable label="Roles" columns={ROLE_COLUMNS} rows={ROLES} getRowId={(r) => r.name} minWidth={640} />
          </Card>

          <Card padded>
            <CardHeader
              title="Administrator permission matrix"
              description="Choose access separately for every object. Field-level restrictions can be added from the relevant Field Map configuration."
              action={<Badge tone="brand">Administrator</Badge>}
            />
            <div className="overflow-auto">
              <table className="w-full min-w-[720px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-line bg-canvas text-left text-[11px] font-extrabold tracking-wide text-subtle uppercase">
                    <th className="px-3 py-2.5">Object / section</th>
                    {PERMISSIONS.map((p) => (
                      <th key={p} className="px-3 py-2.5">
                        {p === 'Delete' ? 'Delete / archive' : p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OBJECTS.map((object) => (
                    <tr key={object} className="border-line-soft border-b last:border-0">
                      <td className="px-3 py-2">
                        <b>{object}</b>
                      </td>
                      {matrix[object]!.map((checked, i) => (
                        <td key={i} className="px-3 py-2">
                          <label className="text-text-soft flex cursor-pointer items-center gap-1.5 text-xs font-semibold">
                            <input type="checkbox" checked={checked} onChange={() => toggleCell(object, i)} />
                            {PERMISSIONS[i]}
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 className="text-ink mt-5 mb-1 text-base">Target-setting permission</h2>
            <p className="text-muted m-0 mb-2 text-xs">This is part of the role permission set.</p>
            <div className="flex flex-wrap gap-5">
              {['Set own targets', 'Set direct-report targets', 'Set targets for any user'].map((label, i) => (
                <label key={label} className="text-text-soft flex cursor-pointer items-center gap-2 text-xs font-semibold">
                  <input type="checkbox" checked={authority[i]} onChange={() => setAuthority((a) => a.map((v, j) => (j === i ? !v : v)))} />
                  {label}
                </label>
              ))}
            </div>
            <Button
              variant="primary"
              className="mt-3.5"
              onClick={() => toast.success('Role permission set saved with an audit entry')}
            >
              Save role permission set
            </Button>
          </Card>
        </>
      )}

      {section === 'audit' && (
        <Card padded>
          <CardHeader
            title="Permission and user audit"
            description="Every permission, target-authority and role-assignment change is logged with actor, old value, new value and date. Entries are append-only and retained for seven years."
            action={<Badge tone="neutral">Last 90 days</Badge>}
          />
          <DataTable label="Permission audit" columns={AUDIT_COLUMNS} rows={AUDIT} getRowId={(r) => r.when + r.change} minWidth={980} />
          <p className="text-muted m-0 mt-3.5 text-xs">
            Entries are append-only and retain the actor, timestamp, affected record, old value and new value.
          </p>
        </Card>
      )}

      <RoleDialog open={creatingRole} onClose={() => setCreatingRole(false)} />
      <UserDialog open={addingUser} onClose={() => setAddingUser(false)} />
    </>
  )
}

function RoleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const sx = { minWidth: 0, width: '100%' } as const
  const [kind, setKind] = useState('Credit')
  return (
    <FormDialog
      open={open}
      title="Create role"
      submitLabel="Create role"
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault()
        toast.success('Role created — configure its permission set')
        onClose()
      }}
    >
      <FormField id="role-name" label="Role name" fullWidth>
        <TextField fullWidth size="small" name="name" placeholder="e.g. Credit Analyst" />
      </FormField>
      <FormField id="role-desc" label="Role description" fullWidth>
        <TextField fullWidth size="small" name="description" placeholder="Purpose and access boundary" />
      </FormField>
      <FormField id="role-kind" label="Pipeline scope">
        <Select value={kind} onChange={(e) => setKind(e.target.value)} fullWidth size="small" sx={sx} inputProps={{ 'aria-label': 'Pipeline scope' }}>
          {['Credit', 'Capital', 'All pipelines'].map((k) => (
            <MenuItem key={k} value={k}>
              {k}
            </MenuItem>
          ))}
        </Select>
      </FormField>
    </FormDialog>
  )
}

function UserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const sx = { minWidth: 0, width: '100%' } as const
  const [role, setRole] = useState('Credit Manager')
  const [manager, setManager] = useState(OWNERS[0])
  return (
    <FormDialog
      open={open}
      title="Add CRM user"
      submitLabel="Invite user"
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault()
        toast.success('Invitation sent — role assignment recorded in audit history')
        onClose()
      }}
    >
      <FormField id="user-name" label="Full name" fullWidth>
        <TextField fullWidth size="small" name="name" placeholder="e.g. Priya Raman" />
      </FormField>
      <FormField id="user-email" label="Email" fullWidth>
        <TextField fullWidth size="small" name="email" type="email" placeholder="name@privateinvest.com" />
      </FormField>
      <FormField id="user-role" label="Initial role">
        <Select value={role} onChange={(e) => setRole(e.target.value)} fullWidth size="small" sx={sx} inputProps={{ 'aria-label': 'Initial role' }}>
          {['Administrator', 'Credit Manager', 'Investor Relations', 'Relationship Manager'].map((r) => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </Select>
      </FormField>
      <FormField id="user-manager" label="Reporting manager">
        <Select value={manager} onChange={(e) => setManager(e.target.value)} fullWidth size="small" sx={sx} inputProps={{ 'aria-label': 'Reporting manager' }}>
          {OWNERS.map((o) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </Select>
      </FormField>
      <p className={cn('text-muted m-0 text-xs sm:col-span-2')}>Target authority is inherited from the assigned role.</p>
    </FormDialog>
  )
}
