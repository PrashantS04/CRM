import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { usePageCrumb } from '@/app/layout/breadcrumbContext'
import { NewTaskDialog } from '@/components/NewTaskDialog'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/toastContext'
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  DataTable,
  InfoGrid,
  PageHeader,
  RecordLayout,
  RecordLink,
  RelationshipStatusBadge,
  RuleItem,
  type Column,
} from '@/components/ui'
import { usePeople } from '@/features/people/hooks'
import { detailPath } from '@/features/opportunities/config'
import { useAllOpportunities } from '@/features/opportunities/hooks'
import type { Person } from '@/types/domain'
import { useEntity } from './hooks'

const COLUMNS: Column<Person>[] = [
  {
    key: 'person',
    header: 'Person',
    cell: (person) => <RecordLink to={`/people/${person.id}`}>{person.name}</RecordLink>,
  },
  { key: 'role', header: 'Role', cell: (person) => person.linkRole },
  {
    key: 'primary',
    header: 'Primary',
    cell: () => <Badge tone="neutral">Yes</Badge>,
  },
  { key: 'since', header: 'Since', cell: () => '2024' },
]

export function EntityDetailPage() {
  const { entityId = '' } = useParams()
  const toast = useToast()
  const entityQuery = useEntity(entityId)
  const people = usePeople()
  const opportunities = useAllOpportunities()
  const [taskOpen, setTaskOpen] = useState(false)
  usePageCrumb(entityQuery.data?.name)

  return (
    <QueryState query={entityQuery}>
      {(entity) => {
        const linkedPeople = (people.data ?? []).filter((p) => p.entityId === entity.id)
        const related = (opportunities.data ?? []).filter((o) => o.party === entity.name)
        return (
          <>
            <PageHeader
              back={{ to: '/entities', label: 'Back to entities' }}
              title={entity.name}
              description={`${entity.type} · ${entity.relationship} relationship`}
              actions={
                <>
                  <Button onClick={() => toast.info('Entity edit form opened')}>Edit entity</Button>
                  <Button
                    variant="primary"
                    startIcon={<Plus size={16} />}
                    onClick={() => setTaskOpen(true)}
                  >
                    Task
                  </Button>
                </>
              }
            />
            <RecordLayout
              aside={
                <>
                  <Card padded>
                    <CardHeader title="Related opportunities" />
                    {related.length === 0 ? (
                      <p className="text-muted m-0 text-[13px]">No related opportunities.</p>
                    ) : (
                      related.map((o) => (
                        <RuleItem
                          key={o.id}
                          icon="✓"
                          title={<RecordLink to={detailPath(o.kind, o.id)}>{o.name}</RecordLink>}
                          description={`${o.stage} · Open`}
                        />
                      ))
                    )}
                    <ButtonLink to="/loan-opportunities" sx={{ mt: 2 }}>
                      View pipeline
                    </ButtonLink>
                  </Card>
                  <Card padded>
                    <CardHeader
                      title="Files"
                      description="SharePoint links only. Files stay in SharePoint."
                    />
                    <Button onClick={() => toast.info('SharePoint folder would open')}>
                      Open folder
                    </Button>
                  </Card>
                </>
              }
            >
              <Card padded>
                <CardHeader
                  title="Entity details"
                  description="Business fact and legal identity are kept separately from relationship roles."
                />
                <InfoGrid
                  items={[
                    { label: 'Entity type', value: entity.type },
                    {
                      label: 'Relationship status',
                      value: <RelationshipStatusBadge status={entity.status} />,
                    },
                    { label: 'Australian Company Number', value: entity.acn },
                    { label: 'Australian Business Number', value: entity.abn },
                    { label: 'Legal name', value: entity.name },
                    { label: 'Owner', value: entity.owner },
                  ]}
                />
              </Card>
              <Card padded>
                <CardHeader
                  title="Linked people"
                  description="Person–Entity links identify an individual’s role within an Entity."
                  action={
                    <Button onClick={() => toast.info('Link person panel opened')}>
                      Link person
                    </Button>
                  }
                />
                <DataTable
                  label="Linked people"
                  columns={COLUMNS}
                  rows={linkedPeople}
                  getRowId={(person) => person.id}
                  emptyMessage="No people linked to this Entity yet."
                  minWidth={480}
                />
              </Card>
            </RecordLayout>
            <NewTaskDialog
              open={taskOpen}
              onClose={() => setTaskOpen(false)}
              relatedTo={entity.name}
              area="People"
            />
          </>
        )
      }}
    </QueryState>
  )
}
