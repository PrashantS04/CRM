import { useEffect } from 'react'
import { z } from 'zod'
import { useToast } from '@/components/feedback/toastContext'
import { FormSelect, FormTextField } from '@/components/form'
import { FormDialog } from '@/components/ui'
import { CURRENT_USER, OWNERS, PERSON_TYPES } from '@/constants/lists'
import { useEntities } from '@/features/entities/hooks'
import { useZodForm } from '@/hooks/useZodForm'
import { useCreatePerson } from './hooks'

const personSchema = z.object({
  name: z.string().trim().min(1, 'Enter the person’s name'),
  type: z.enum(PERSON_TYPES),
  email: z.email('Enter a valid email address'),
  owner: z.string().min(1, 'Choose an owner'),
  entityId: z.string(),
})

const DEFAULTS = {
  name: '',
  type: 'Not yet known' as const,
  email: '',
  owner: CURRENT_USER,
  entityId: '',
}

export function NewPersonDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const createPerson = useCreatePerson()
  const entities = useEntities()
  const form = useZodForm(personSchema, DEFAULTS)

  useEffect(() => {
    if (!open) form.reset(DEFAULTS)
  }, [open, form])

  const submit = form.handleSubmit(async (values) => {
    await createPerson.mutateAsync({ ...values, entityId: values.entityId || null })
    toast.success('Person saved')
    onClose()
  })

  const entityOptions = [
    { value: '', label: 'No Entity link yet' },
    ...(entities.data ?? []).map((entity) => ({ value: entity.id, label: entity.name })),
  ]

  return (
    <FormDialog
      open={open}
      title="New person"
      description="Create one record for one natural person. Enter person type, email and primary Entity link."
      submitLabel="Save person"
      onClose={onClose}
      onSubmit={submit}
      isSubmitting={form.formState.isSubmitting}
    >
      <FormTextField
        control={form.control}
        name="name"
        label="Name"
        placeholder="Full name"
        fullWidth
      />
      <FormSelect control={form.control} name="type" label="Person type" options={PERSON_TYPES} />
      <FormTextField
        control={form.control}
        name="email"
        label="Email"
        type="email"
        placeholder="name@company.com"
      />
      <FormSelect
        control={form.control}
        name="entityId"
        label="Primary Entity"
        options={entityOptions}
      />
      <FormSelect control={form.control} name="owner" label="Owner" options={OWNERS} />
    </FormDialog>
  )
}
