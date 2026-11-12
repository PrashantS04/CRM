import { Check, Plus } from 'lucide-react'
import { useState } from 'react'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/toastContext'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  PageHeader,
  RuleItem,
  ThreePane,
  type Column,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import type { FieldMapRow } from '@/types/domain'
import { AddFieldDialog } from './AddFieldDialog'
import { useFieldMapCatalog } from './hooks'

const COLUMNS: Column<FieldMapRow>[] = [
  { key: 'field', header: 'Field', cell: (row) => <b>{row.field}</b> },
  { key: 'type', header: 'Type', cell: (row) => row.type },
  {
    key: 'required',
    header: 'Required',
    cell: (row) => (
      <Badge tone={row.required.includes('Required') ? 'brand' : 'neutral'}>{row.required}</Badge>
    ),
  },
  { key: 'rule', header: 'Picklist or rule', cell: (row) => row.rule },
]

export function FieldMapPage() {
  const toast = useToast()
  const catalog = useFieldMapCatalog()
  const [selected, setSelected] = useState('Person')
  const [adding, setAdding] = useState(false)

  return (
    <>
      <PageHeader
        title="Field map configuration"
        description="Fields, types, required state and source notes from EXT CRM Field Map Master Contact."
        actions={
          <Button variant="primary" onClick={() => toast.success('Field map changes saved')}>
            Save changes
          </Button>
        }
      />
      <QueryState query={catalog}>
        {(blocks) => {
          const names = Object.keys(blocks)
          const rows = blocks[selected] ?? blocks.Person ?? []
          return (
            <ThreePane variant="objects">
              <Card as="nav" aria-label="Mapped CRM blocks">
                <div className="p-5">
                  <CardHeader
                    className="mb-0"
                    title="Mapped CRM blocks"
                    description="Select an object or related record block."
                  />
                </div>
                <ul className="m-0 list-none p-0">
                  {names.map((name) => (
                    <li key={name}>
                      <button
                        type="button"
                        onClick={() => setSelected(name)}
                        aria-current={name === selected ? 'true' : undefined}
                        className={cn(
                          'border-line-soft flex w-full cursor-pointer items-center justify-between border-0 border-b border-l-[3px] border-l-transparent p-3 text-left',
                          name === selected
                            ? 'bg-brand-tint text-brand border-l-brand font-bold'
                            : 'bg-surface text-text-soft',
                        )}
                      >
                        {name}
                        <small className="text-subtle font-normal">
                          {blocks[name]?.length} fields
                        </small>
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card padded>
                <CardHeader
                  title={`${selected} fields`}
                  description="Field source: Contact field map. Required values and configured choices can be maintained in Settings."
                  action={
                    <Button
                      variant="primary"
                      startIcon={<Plus size={15} />}
                      onClick={() => setAdding(true)}
                    >
                      Add custom field
                    </Button>
                  }
                />
                <DataTable
                  label={`${selected} fields`}
                  columns={COLUMNS}
                  rows={rows}
                  getRowId={(row) => row.field}
                  minWidth={560}
                />
              </Card>

              <Card as="aside" padded>
                <CardHeader
                  title="Field map notes"
                  description="Person maps to the source Contact object. Linked entities, opportunities, Broker profile, Panel membership, Notes, Activities and Documents retain their own source blocks."
                />
                <RuleItem
                  icon={<Check size={12} />}
                  title="Person and links"
                  description="Mapped from Contact records"
                />
                <RuleItem
                  icon={<Check size={12} />}
                  title="Entity identity"
                  description="ACN and ABN remain protected by G1"
                />
                <RuleItem
                  icon={<Check size={12} />}
                  title="Dynamic fields"
                  description="Additional fields remain configurable"
                />
              </Card>
              <AddFieldDialog open={adding} onClose={() => setAdding(false)} />
            </ThreePane>
          )
        }}
      </QueryState>
    </>
  )
}
