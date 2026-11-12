import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useToast } from '@/components/feedback/toastContext'
import { FormSelect, FormTextField } from '@/components/form'
import { FormDialog } from '@/components/ui'
import { CURRENT_USER, LEAD_CATEGORIES, LEAD_STATUSES, OWNERS } from '@/constants/lists'
import { useEntities } from '@/features/entities/hooks'
import { useZodForm } from '@/hooks/useZodForm'
import type { OpportunityKind } from '@/types/domain'
import { OPPORTUNITY_KINDS } from './config'
import { useCreateOpportunity, usePipelines } from './hooks'

const opportunitySchema = z.object({
  name: z.string().trim().min(1, 'Enter an opportunity name'),
  party: z.string().min(1, 'Choose a counterparty'),
  leadCategory: z.enum(LEAD_CATEGORIES),
  leadStatus: z.enum(LEAD_STATUSES),
  owner: z.string().min(1, 'Choose an owner'),
  stage: z.string().min(1),
  note: z.string(),
})

export interface NewOpportunityDialogProps {
  kind: OpportunityKind
  open: boolean
  onClose: () => void
}

export function NewOpportunityDialog({ kind, open, onClose }: NewOpportunityDialogProps) {
  const config = OPPORTUNITY_KINDS[kind]
  const navigate = useNavigate()
  const toast = useToast()
  const entities = useEntities()
  const pipelines = usePipelines()
  const create = useCreateOpportunity()
  const firstStage = pipelines.data?.find((p) => p.id === config.pipelineId)?.stages[0] ?? ''

  const defaults = {
    name: '',
    party: '',
    leadCategory: 'Lead' as const,
    leadStatus: 'Suspect' as const,
    owner: CURRENT_USER,
    stage: firstStage,
    note: '',
  }
  const form = useZodForm(opportunitySchema, defaults)

  useEffect(() => {
    if (open) form.reset({ ...defaults })
    // eslint-disable-next-line react/exhaustive-deps -- reset only when the dialog opens
  }, [open, firstStage])

  const submit = form.handleSubmit(async (values) => {
    const created = await create.mutateAsync({
      kind,
      name: values.name,
      party: values.party,
      owner: values.owner,
      source: 'Direct',
      amount: null,
      leadCategory: values.leadCategory,
      leadStatus: values.leadStatus,
      stage: values.stage,
      note: values.note.trim() || undefined,
    })
    toast.success(`${config.singular} created`)
    onClose()
    navigate(`${config.basePath}/${created.id}`)
  })

  const partyOptions = (entities.data ?? []).map((entity) => entity.name)

  return (
    <FormDialog
      open={open}
      title={`New ${config.singular}`}
      submitLabel="Create opportunity"
      onClose={onClose}
      onSubmit={submit}
      isSubmitting={form.formState.isSubmitting}
    >
      <FormTextField
        control={form.control}
        name="name"
        label="Opportunity name"
        placeholder="Enter opportunity name"
      />
      <FormSelect
        control={form.control}
        name="party"
        label={config.partyLabel}
        options={partyOptions}
      />
      <FormSelect
        control={form.control}
        name="leadCategory"
        label="Lead category"
        options={LEAD_CATEGORIES}
      />
      <FormSelect
        control={form.control}
        name="leadStatus"
        label="Lead status"
        options={LEAD_STATUSES}
      />
      <FormSelect control={form.control} name="owner" label="Owner" options={OWNERS} />
      <FormSelect
        control={form.control}
        name="stage"
        label="Initial stage"
        options={firstStage ? [firstStage] : []}
      />
      <FormTextField
        control={form.control}
        name="note"
        label="Initial note"
        placeholder="Optional context, captured in activity history"
        fullWidth
      />
    </FormDialog>
  )
}
