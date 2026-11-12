import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExportDialog } from '@/components/ExportDialog'
import { QueryState } from '@/components/feedback/QueryState'
import {
  Badge,
  Button,
  Callout,
  DataTable,
  FilterBar,
  FilterSelect,
  PageHeader,
  RecordLink,
  RelationshipStatusBadge,
  SearchInput,
  type Column,
} from '@/components/ui'
import { ENTITY_TYPES, RELATIONSHIP_STATUSES } from '@/constants/lists'
import { pluralize } from '@/lib/format'
import type { Entity } from '@/types/domain'
import { useEntities } from './hooks'
import { NewEntityDialog } from './NewEntityDialog'

const COLUMNS: Column<Entity>[] = [
  {
    key: 'name',
    header: 'Entity',
    cell: (entity) => <RecordLink to={`/entities/${entity.id}`}>{entity.name}</RecordLink>,
  },
  {
    key: 'type',
    header: 'Entity type',
    cell: (entity) => (
      <Badge tone="teal" shape="chip">
        {entity.type}
      </Badge>
    ),
  },
  {
    key: 'ids',
    header: 'ACN / ABN',
    cell: (entity) => (
      <>
        {entity.acn}
        <br />
        <small className="text-subtle">ABN {entity.abn}</small>
      </>
    ),
  },
  { key: 'relationship', header: 'Relationship', cell: (entity) => entity.relationship },
  { key: 'owner', header: 'Owner', cell: (entity) => entity.owner },
  {
    key: 'status',
    header: 'Status',
    cell: (entity) => <RelationshipStatusBadge status={entity.status} />,
  },
]

export function EntitiesPage() {
  const navigate = useNavigate()
  const query = useEntities()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [creating, setCreating] = useState(false)
  const [exporting, setExporting] = useState(false)

  const rowsFor = useMemo(
    () => (entities: Entity[]) => {
      const term = search.trim().toLowerCase()
      return entities.filter(
        (entity) =>
          (!type || entity.type === type) &&
          (!status || entity.status === status) &&
          (!term ||
            `${entity.name} ${entity.type} ${entity.acn} ${entity.abn}`
              .toLowerCase()
              .includes(term)),
      )
    },
    [search, type, status],
  )

  return (
    <>
      <PageHeader
        title="Entities"
        description="Organisations and legal structures linked to people, opportunities and roles."
        actions={
          <Button
            variant="primary"
            startIcon={<Plus size={16} />}
            onClick={() => setCreating(true)}
          >
            New entity
          </Button>
        }
      />
      <Callout className="mb-[18px]">
        Hard gate G1: the CRM blocks an Entity save when an ACN or ABN already exists. Format
        validation is also applied before saving.
      </Callout>
      <QueryState query={query}>
        {(all) => {
          const rows = rowsFor(all)
          return (
            <>
              <FilterBar>
                <SearchInput value={search} onChange={setSearch} placeholder="Search entities" />
                <FilterSelect
                  value={type}
                  onChange={setType}
                  options={ENTITY_TYPES}
                  allLabel="All entity types"
                />
                <FilterSelect
                  value={status}
                  onChange={setStatus}
                  options={RELATIONSHIP_STATUSES}
                  allLabel="All relationship statuses"
                />
                <Button onClick={() => setExporting(true)}>Export</Button>
                <span className="text-muted ml-auto text-xs">
                  {pluralize(rows.length, 'entity', 'entities')}
                </span>
              </FilterBar>
              <DataTable
                label="Entities"
                columns={COLUMNS}
                rows={rows}
                getRowId={(entity) => entity.id}
                onRowClick={(entity) => navigate(`/entities/${entity.id}`)}
                emptyMessage="No entities match this search."
                minWidth={900}
              />
              <ExportDialog
                open={exporting}
                subject="Entities"
                rows={rows.map(
                  ({ name, type: entityType, acn, abn, relationship, owner, status: s }) => ({
                    name,
                    type: entityType,
                    acn,
                    abn,
                    relationship,
                    owner,
                    status: s,
                  }),
                )}
                onClose={() => setExporting(false)}
              />
            </>
          )
        }}
      </QueryState>
      <NewEntityDialog open={creating} onClose={() => setCreating(false)} />
    </>
  )
}
