import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QueryState } from '@/components/feedback/QueryState'
import { ExportDialog } from '@/components/ExportDialog'
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  FilterBar,
  FilterSelect,
  PageHeader,
  RecordLink,
  RelationshipStatusBadge,
  SearchInput,
  type Column,
} from '@/components/ui'
import { PERSON_TYPES, RELATIONSHIP_STATUSES } from '@/constants/lists'
import { useEntities } from '@/features/entities/hooks'
import { pluralize } from '@/lib/format'
import type { Entity, Person } from '@/types/domain'
import { usePeople } from './hooks'
import { NewPersonDialog } from './NewPersonDialog'

export function PeoplePage() {
  const navigate = useNavigate()
  const people = usePeople()
  const entities = useEntities()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [creating, setCreating] = useState(false)
  const [exporting, setExporting] = useState(false)

  const entityById = useMemo(
    () => new Map<string, Entity>((entities.data ?? []).map((entity) => [entity.id, entity])),
    [entities.data],
  )

  const columns = useMemo<Column<Person>[]>(
    () => [
      {
        key: 'name',
        header: 'Person',
        cell: (person) => (
          <span className="flex items-center gap-2">
            <Avatar name={person.name} />
            <RecordLink to={`/people/${person.id}`}>{person.name}</RecordLink>
          </span>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        cell: (person) => (
          <Badge tone="teal" shape="chip">
            {person.type}
          </Badge>
        ),
      },
      {
        key: 'entity',
        header: 'Entity',
        cell: (person) => {
          const entity = person.entityId ? entityById.get(person.entityId) : undefined
          return entity ? (
            <RecordLink to={`/entities/${entity.id}`}>{entity.name}</RecordLink>
          ) : (
            'Not linked'
          )
        },
      },
      { key: 'roles', header: 'Relationship', cell: (person) => person.roles },
      { key: 'owner', header: 'Owner', cell: (person) => person.owner },
      {
        key: 'status',
        header: 'Status',
        cell: (person) => <RelationshipStatusBadge status={person.status} />,
      },
    ],
    [entityById],
  )

  return (
    <>
      <PageHeader
        title="People"
        description="One record for each natural person, with their relationships and CRM activity in one place."
        actions={
          <Button
            variant="primary"
            startIcon={<Plus size={16} />}
            onClick={() => setCreating(true)}
          >
            New person
          </Button>
        }
      />
      <QueryState query={people}>
        {(all) => {
          const term = search.trim().toLowerCase()
          const rows = all.filter((person) => {
            const entityName = person.entityId ? (entityById.get(person.entityId)?.name ?? '') : ''
            return (
              (!type || person.type === type) &&
              (!status || person.status === status) &&
              (!term || `${person.name} ${entityName} ${person.type}`.toLowerCase().includes(term))
            )
          })
          return (
            <>
              <FilterBar>
                <SearchInput value={search} onChange={setSearch} placeholder="Search people" />
                <FilterSelect
                  value={type}
                  onChange={setType}
                  options={PERSON_TYPES}
                  allLabel="All person types"
                />
                <FilterSelect
                  value={status}
                  onChange={setStatus}
                  options={RELATIONSHIP_STATUSES}
                  allLabel="All relationship statuses"
                />
                <Button onClick={() => setExporting(true)}>Export</Button>
                <span className="text-muted ml-auto text-xs">
                  {pluralize(rows.length, 'person', 'people')}
                </span>
              </FilterBar>
              <DataTable
                label="People"
                columns={columns}
                rows={rows}
                getRowId={(person) => person.id}
                onRowClick={(person) => navigate(`/people/${person.id}`)}
                emptyMessage="No people match this search."
                minWidth={900}
              />
              <ExportDialog
                open={exporting}
                subject="People"
                rows={rows.map(({ name, type: personType, email, phone, owner, status: s }) => ({
                  name,
                  type: personType,
                  email,
                  phone,
                  owner,
                  status: s,
                }))}
                onClose={() => setExporting(false)}
              />
            </>
          )
        }}
      </QueryState>
      <NewPersonDialog open={creating} onClose={() => setCreating(false)} />
    </>
  )
}
