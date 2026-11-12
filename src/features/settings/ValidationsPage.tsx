import { Plus } from 'lucide-react'
import { useState } from 'react'
import { ExportDialog } from '@/components/ExportDialog'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/toastContext'
import {
  Badge,
  Button,
  Callout,
  Card,
  CardHeader,
  DataTable,
  PageHeader,
  type Column,
} from '@/components/ui'
import { HARD_GATE_REGISTER, type ValidationRuleRow } from '@/mocks/fieldMap'
import { useValidationRules } from './hooks'

const COLUMNS: Column<ValidationRuleRow>[] = [
  { key: 'type', header: 'Field type', cell: (row) => <b>{row.fieldType}</b> },
  { key: 'available', header: 'Available validations', cell: (row) => row.available },
  {
    key: 'gate',
    header: 'Hard gate use',
    cell: (row) => (
      <Badge tone={row.hardGate === 'G2 format' ? 'brand' : 'neutral'}>{row.hardGate}</Badge>
    ),
  },
  { key: 'applies', header: 'Applies to', cell: () => 'All custom forms' },
]

export function ValidationsPage() {
  const toast = useToast()
  const rules = useValidationRules()
  const [exporting, setExporting] = useState(false)

  return (
    <>
      <PageHeader
        title="Validation rules"
        description="Configure validations by field type. The system applies only the approved hard gates to block actions."
        actions={
          <Button
            variant="primary"
            startIcon={<Plus size={16} />}
            onClick={() => toast.info('Validation rule builder opened')}
          >
            Add validation rule
          </Button>
        }
      />
      <Callout>
        Configured validation rules protect data quality. Stage fields that are merely expected
        create data gaps and do not block a save or stage move.
      </Callout>
      <Card padded className="mt-4">
        <CardHeader
          title="Field type validations"
          description="Choose validation rules when defining a custom field."
          action={<Button onClick={() => setExporting(true)}>Export</Button>}
        />
        <QueryState query={rules}>
          {(rows) => (
            <>
              <DataTable
                label="Validation rules"
                columns={COLUMNS}
                rows={rows}
                getRowId={(row) => row.fieldType}
                minWidth={640}
              />
              <ExportDialog
                open={exporting}
                subject="Validation rules"
                rows={rows.map((row) => ({
                  fieldType: row.fieldType,
                  available: row.available,
                  hardGate: row.hardGate,
                }))}
                onClose={() => setExporting(false)}
              />
            </>
          )}
        </QueryState>
      </Card>
      <Card padded className="mt-4">
        <CardHeader title="Hard gate register" description={HARD_GATE_REGISTER} />
      </Card>
    </>
  )
}
