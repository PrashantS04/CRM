import { useEffect } from 'react'
import { z } from 'zod'
import { useToast } from '@/components/feedback/toastContext'
import { FormCheckbox, FormSelect, FormTextField } from '@/components/form'
import { FormDialog } from '@/components/ui'
import { FIELD_TYPES } from '@/constants/lists'
import { useZodForm } from '@/hooks/useZodForm'

const fieldSchema = z.object({
  label: z.string().trim().min(1, 'Enter a field label'),
  type: z.enum(FIELD_TYPES),
  required: z.boolean(),
})

export type NewFieldValues = z.infer<typeof fieldSchema>

const DEFAULTS: NewFieldValues = { label: '', type: 'Text', required: false }

export interface AddFieldDialogProps {
  open: boolean
  onClose: () => void
  onAdd?: (field: NewFieldValues) => void
}

export function AddFieldDialog({ open, onClose, onAdd }: AddFieldDialogProps) {
  const toast = useToast()
  const form = useZodForm(fieldSchema, DEFAULTS)

  useEffect(() => {
    if (!open) form.reset(DEFAULTS)
  }, [open, form])

  return (
    <FormDialog
      open={open}
      title="Add custom field"
      submitLabel="Add field"
      onClose={onClose}
      onSubmit={form.handleSubmit((values) => {
        onAdd?.(values)
        toast.success('Custom field added')
        onClose()
      })}
    >
      <FormTextField
        control={form.control}
        name="label"
        label="Field label"
        placeholder="e.g. Credit risk rating"
      />
      <FormSelect control={form.control} name="type" label="Field type" options={FIELD_TYPES} />
      <FormCheckbox control={form.control} name="required" label="Required field" />
    </FormDialog>
  )
}
