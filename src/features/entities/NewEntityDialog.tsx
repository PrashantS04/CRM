import { useEffect } from 'react'
import { ApiError } from '@/api/http'
import { useToast } from '@/components/feedback/toastContext'
import { FormSelect, FormTextField } from '@/components/form'
import { FormDialog } from '@/components/ui'
import { CURRENT_USER, ENTITY_TYPES, OWNERS } from '@/constants/lists'
import { useZodForm } from '@/hooks/useZodForm'
import { useCreateEntity } from './hooks'
import { entitySchema, type EntityFormValues } from './schema'

const DEFAULTS: EntityFormValues = {
  name: '',
  type: 'Not yet known',
  acn: '',
  abn: '',
  owner: CURRENT_USER,
}

export function NewEntityDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const createEntity = useCreateEntity()
  const form = useZodForm(entitySchema, DEFAULTS)

  useEffect(() => {
    if (!open) form.reset(DEFAULTS)
  }, [open, form])

  const submit = form.handleSubmit(async (values) => {
    try {
      await createEntity.mutateAsync(values)
      toast.success('Entity saved')
      onClose()
    } catch (error) {
      // Hard gate G1: surface a duplicate ACN/ABN on the offending field.
      if (error instanceof ApiError && (error.field === 'acn' || error.field === 'abn')) {
        form.setError(error.field, { message: error.message })
        return
      }
      throw error
    }
  })

  return (
    <FormDialog
      open={open}
      title="New entity"
      description="ACN and ABN will be checked for duplicate and valid format before an Entity saves."
      submitLabel="Save entity"
      onClose={onClose}
      onSubmit={submit}
      isSubmitting={form.formState.isSubmitting}
    >
      <FormTextField
        control={form.control}
        name="name"
        label="Entity name"
        placeholder="Legal or trading name"
        fullWidth
      />
      <FormSelect control={form.control} name="type" label="Entity type" options={ENTITY_TYPES} />
      <FormSelect control={form.control} name="owner" label="Owner" options={OWNERS} />
      <FormTextField control={form.control} name="acn" label="ACN" placeholder="9 digits" />
      <FormTextField control={form.control} name="abn" label="ABN" placeholder="11 digits" />
    </FormDialog>
  )
}
