import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import { ArrowDown, ArrowUp, GripVertical, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { FormField } from '@/components/form'
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
  ThreePane,
  type Column,
} from '@/components/ui'
import { FIELD_TYPES } from '@/constants/lists'
import { cn } from '@/lib/cn'
import type { PipelineDefinition, StageField } from '@/types/domain'
import { usePipelines } from '@/features/opportunities/hooks'
import { AddFieldDialog } from './AddFieldDialog'
import { useAddStage, useMoveStage, useReorderStage, useStageFields } from './hooks'
import { NewPipelineDialog } from './NewPipelineDialog'

const VALIDATION_OPTIONS = ['None', 'Must select a value', 'Maximum 500 characters']

const FIELD_COLUMNS: Column<StageField>[] = [
  { key: 'name', header: 'Field name', cell: (field) => <b>{field.name}</b> },
  { key: 'type', header: 'Type', cell: (field) => field.type },
  {
    key: 'required',
    header: 'Required',
    cell: (field) => (
      <Badge tone={field.required === 'Yes' ? 'brand' : 'neutral'}>{field.required}</Badge>
    ),
  },
  { key: 'validation', header: 'Validation', cell: (field) => field.validation },
]

interface StageListProps {
  pipeline: PipelineDefinition
  selected: number
  onSelect: (index: number) => void
}

function StageList({ pipeline, selected, onSelect }: StageListProps) {
  const toast = useToast()
  const addStage = useAddStage()
  const moveStage = useMoveStage()
  const reorderStage = useReorderStage()
  const [name, setName] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const inputId = useId()

  const drop = (to: number) => {
    if (dragIndex === null || dragIndex === to) {
      setDragIndex(null)
      return
    }
    const from = dragIndex
    setDragIndex(null)
    reorderStage.mutate(
      { id: pipeline.id, index: from, to },
      { onSuccess: () => onSelect(to) },
    )
  }

  const add = async () => {
    const stage = name.trim()
    if (!stage) return
    await addStage.mutateAsync({ id: pipeline.id, stage })
    setName('')
    onSelect(pipeline.stages.length)
    toast.success(`Stage "${stage}" added`)
  }

  return (
    <Card padded>
      <CardHeader
        title={pipeline.name}
        description="Reorder stages, add stages and assign different expected fields to each stage."
      />
      <ol className="m-0 grid list-none gap-2.5 p-0">
        {pipeline.stages.map((stage, index) => (
          <li
            key={`${stage}-${index}`}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => drop(index)}
            onDragEnd={() => setDragIndex(null)}
            className={cn(
              'border-line grid grid-cols-[1fr_auto] items-center gap-2.5 rounded-lg border p-[13px]',
              index === selected ? 'border-brand bg-brand-tint' : 'bg-surface',
              dragIndex === index && 'opacity-50',
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={index === selected ? 'true' : undefined}
              className="grid cursor-pointer grid-cols-[36px_1fr] items-center gap-2.5 border-0 bg-transparent p-0 text-left"
            >
              <span className="bg-neutral-soft text-neutral-text grid size-[34px] place-items-center rounded-full font-bold">
                {index + 1}
              </span>
              <span>
                <b className="text-sm">{stage}</b>
                <small className="text-subtle mt-[3px] block">
                  Stage {index + 1} of {pipeline.stages.length}
                </small>
              </span>
            </button>
            <span className="flex items-center gap-1">
              <GripVertical size={15} className="text-subtle cursor-grab" aria-hidden />
              <IconButton
                size="small"
                aria-label={`Move ${stage} up`}
                disabled={index === 0}
                onClick={() =>
                  moveStage.mutate(
                    { id: pipeline.id, index, direction: -1 },
                    { onSuccess: () => onSelect(index - 1) },
                  )
                }
              >
                <ArrowUp size={14} />
              </IconButton>
              <IconButton
                size="small"
                aria-label={`Move ${stage} down`}
                disabled={index === pipeline.stages.length - 1}
                onClick={() =>
                  moveStage.mutate(
                    { id: pipeline.id, index, direction: 1 },
                    { onSuccess: () => onSelect(index + 1) },
                  )
                }
              >
                <ArrowDown size={14} />
              </IconButton>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-[15px] flex gap-2">
        <OutlinedInput
          id={inputId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && add()}
          placeholder="Stage name"
          fullWidth
          inputProps={{ 'aria-label': 'Stage name' }}
        />
        <Button variant="ghost" startIcon={<Plus size={15} />} onClick={add} sx={{ flexShrink: 0 }}>
          Add stage
        </Button>
      </div>
    </Card>
  )
}

interface FieldInspectorProps {
  field: StageField | undefined
  onChange: (patch: Partial<StageField>) => void
}

function FieldInspector({ field, onChange }: FieldInspectorProps) {
  const ids = { type: useId(), label: useId(), validation: useId() }
  return (
    <Card as="aside" padded className="border-t-brand border-t-[3px]">
      <CardHeader title="Edit field" />
      {field ? (
        <div className="grid gap-3.5">
          <FormField id={ids.type} label="Field type">
            <Select
              id={ids.type}
              fullWidth
              value={field.type}
              onChange={(event) => onChange({ type: event.target.value })}
            >
              {[...new Set([field.type, ...FIELD_TYPES])].map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormField>
          <FormField id={ids.label} label="Label">
            <OutlinedInput
              id={ids.label}
              fullWidth
              value={field.name}
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </FormField>
          <div className="flex items-center justify-between">
            <label className="text-text-soft text-xs font-bold" htmlFor="required-switch">
              Required
            </label>
            <Switch
              id="required-switch"
              checked={field.required === 'Yes'}
              onChange={(event) => onChange({ required: event.target.checked ? 'Yes' : 'No' })}
            />
          </div>
          <FormField id={ids.validation} label="Validation rule">
            <Select
              id={ids.validation}
              fullWidth
              value={field.validation}
              onChange={(event) => onChange({ validation: event.target.value })}
            >
              {[...new Set([field.validation, ...VALIDATION_OPTIONS])].map((rule) => (
                <MenuItem key={rule} value={rule}>
                  {rule}
                </MenuItem>
              ))}
            </Select>
          </FormField>
        </div>
      ) : (
        <p className="text-muted m-0 text-[13px]">Select a field to edit its settings.</p>
      )}
      <Callout tone="notice" className="mt-4">
        Expected fields help data quality. Only approved hard gates block a stage action.
      </Callout>
    </Card>
  )
}

export function PipelineConfigPage() {
  const toast = useToast()
  const pipelines = usePipelines()
  const stageFields = useStageFields()
  const [pipelineId, setPipelineId] = useState('loan')
  const [selectedStage, setSelectedStage] = useState(0)
  const [selectedField, setSelectedField] = useState(0)
  // Edits are kept locally on top of the server list (derived, not synced in an effect).
  const [edited, setEdited] = useState<StageField[] | null>(null)
  const fields = edited ?? stageFields.data ?? []
  const updateFields = (update: (current: StageField[]) => StageField[]) =>
    setEdited(update(fields))
  const [creatingPipeline, setCreatingPipeline] = useState(false)
  const [addingField, setAddingField] = useState(false)

  const selectPipeline = (id: string) => {
    setPipelineId(id)
    setSelectedStage(0)
  }

  return (
    <>
      <PageHeader
        title="Opportunity pipeline configuration"
        description="Pipeline names, stages and field assignments are supplied dynamically by the backend configuration."
        actions={
          <Button variant="primary" onClick={() => toast.success('Pipeline configuration saved')}>
            Save changes
          </Button>
        }
      />
      <QueryState query={pipelines}>
        {(all) => {
          const pipeline = all.find((p) => p.id === pipelineId) ?? all[0]!
          const stage = pipeline.stages[selectedStage] ?? pipeline.stages[0]
          return (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2.5">
                <label htmlFor="pipeline-picker" className="font-bold">
                  Configure pipeline
                </label>
                <Select
                  id="pipeline-picker"
                  value={pipeline.id}
                  onChange={(event) => selectPipeline(event.target.value)}
                  sx={{ minWidth: 260 }}
                >
                  {all.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
                <Button startIcon={<Plus size={15} />} onClick={() => setCreatingPipeline(true)}>
                  New pipeline
                </Button>
                <span className="text-muted text-[13px]">{all.length} pipelines available</span>
              </div>

              <ThreePane variant="config">
                <StageList
                  pipeline={pipeline}
                  selected={selectedStage}
                  onSelect={setSelectedStage}
                />
                <Card padded>
                  <CardHeader
                    title={`${stage} stage`}
                    description="Configure optional and expected fields. Hard gates are only enabled where authorised."
                    action={
                      <Button
                        variant="primary"
                        startIcon={<Plus size={15} />}
                        onClick={() => setAddingField(true)}
                      >
                        Add custom field
                      </Button>
                    }
                  />
                  <DataTable
                    label="Stage fields"
                    columns={FIELD_COLUMNS}
                    rows={fields}
                    getRowId={(field) => field.name}
                    onRowClick={(field) => setSelectedField(fields.indexOf(field))}
                    selectedRowId={fields[selectedField]?.name}
                    minWidth={460}
                  />
                </Card>
                <FieldInspector
                  field={fields[selectedField]}
                  onChange={(patch) =>
                    updateFields((current) =>
                      current.map((field, index) =>
                        index === selectedField ? { ...field, ...patch } : field,
                      ),
                    )
                  }
                />
              </ThreePane>

              <NewPipelineDialog
                open={creatingPipeline}
                onClose={() => setCreatingPipeline(false)}
                onCreated={selectPipeline}
              />
              <AddFieldDialog
                open={addingField}
                onClose={() => setAddingField(false)}
                onAdd={(field) =>
                  updateFields((current) => [
                    ...current,
                    {
                      name: field.label,
                      type: field.type,
                      required: field.required ? 'Yes' : 'No',
                      validation: 'None',
                    },
                  ])
                }
              />
            </>
          )
        }}
      </QueryState>
    </>
  )
}
