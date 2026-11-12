import { useEffect } from 'react'
import { z } from 'zod'
import { FormSelect, FormTextField } from '@/components/form'
import { FormDialog } from '@/components/ui'
import { useZodForm } from '@/hooks/useZodForm'
import type { ID } from '@/types/domain'
import { useCreatePipeline } from './hooks'

const pipelineSchema = z.object({
  name: z.string().trim().min(1, 'Enter a pipeline name'),
  kind: z.enum(['Credit', 'Capital', 'Custom']),
  firstStage: z.string().trim().min(1, 'Enter a first stage'),
})

const DEFAULTS = { name: '', kind: 'Credit' as const, firstStage: '' }

export interface NewPipelineDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (id: ID) => void
}

export function NewPipelineDialog({ open, onClose, onCreated }: NewPipelineDialogProps) {
  const create = useCreatePipeline()
  const form = useZodForm(pipelineSchema, DEFAULTS)

  useEffect(() => {
    if (!open) form.reset(DEFAULTS)
  }, [open, form])

  const submit = form.handleSubmit(async (values) => {
    const created = await create.mutateAsync(values)
    onCreated(created.id)
    onClose()
  })

  return (
    <FormDialog
      open={open}
      title="Create pipeline"
      submitLabel="Create pipeline"
      onClose={onClose}
      onSubmit={submit}
      isSubmitting={form.formState.isSubmitting}
    >
      <FormTextField
        control={form.control}
        name="name"
        label="Pipeline name"
        placeholder="e.g. Broker Opportunities"
      />
      <FormSelect
        control={form.control}
        name="kind"
        label="Pipeline type"
        options={['Credit', 'Capital', 'Custom']}
      />
      <FormTextField
        control={form.control}
        name="firstStage"
        label="First stage"
        placeholder="e.g. New enquiry"
        fullWidth
      />
    </FormDialog>
  )
}
