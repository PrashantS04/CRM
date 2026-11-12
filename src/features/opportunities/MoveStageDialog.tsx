import { useEffect } from 'react'
import { z } from 'zod'
import { useToast } from '@/components/feedback/toastContext'
import { FormSelect } from '@/components/form'
import { Callout, FormDialog } from '@/components/ui'
import { useZodForm } from '@/hooks/useZodForm'
import type { Opportunity } from '@/types/domain'
import { useMoveOpportunityStage } from './hooks'

const schema = z.object({ stage: z.string().min(1, 'Choose a stage') })

export interface MoveStageDialogProps {
  open: boolean
  opportunity: Opportunity
  stages: readonly string[]
  onClose: () => void
}

/** Stage moves never block except the documented hard gates (brief §2.4). */
export function MoveStageDialog({ open, opportunity, stages, onClose }: MoveStageDialogProps) {
  const toast = useToast()
  const move = useMoveOpportunityStage(opportunity.kind)
  const form = useZodForm(schema, { stage: opportunity.stage })

  useEffect(() => {
    if (open) form.reset({ stage: opportunity.stage })
  }, [open, opportunity.stage, form])

  const submit = form.handleSubmit(async ({ stage }) => {
    await move.mutateAsync({ id: opportunity.id, stage })
    toast.success(`Moved to ${stage}`)
    onClose()
  })

  return (
    <FormDialog
      open={open}
      title={`Move ${opportunity.name}`}
      submitLabel="Move stage"
      onClose={onClose}
      onSubmit={submit}
      isSubmitting={form.formState.isSubmitting}
    >
      <FormSelect
        control={form.control}
        name="stage"
        label="New stage"
        options={stages}
        fullWidth
      />
      <Callout className="sm:col-span-2">
        Expected fields create data gaps; only documented hard gates can block an action.
      </Callout>
    </FormDialog>
  )
}
