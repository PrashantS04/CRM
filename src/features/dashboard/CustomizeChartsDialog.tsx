import { useEffect } from 'react'
import { FormCheckbox } from '@/components/form'
import { FormDialog } from '@/components/ui'
import { useZodForm } from '@/hooks/useZodForm'
import { prefsSchema, type ChartPrefs } from './chartPrefs'

export interface CustomizeChartsDialogProps {
  open: boolean
  title: string
  prefs: ChartPrefs
  onSave: (prefs: ChartPrefs) => void
  onClose: () => void
}

export function CustomizeChartsDialog({
  open,
  title,
  prefs,
  onSave,
  onClose,
}: CustomizeChartsDialogProps) {
  const form = useZodForm(prefsSchema, prefs)

  useEffect(() => {
    if (open) form.reset(prefs)
  }, [open, prefs, form])

  return (
    <FormDialog
      open={open}
      title={`Customize ${title} dashboard`}
      description="Choose how to visualise the same filtered pipeline data. Saved layouts remain scoped to the current user role."
      submitLabel="Save layout"
      onClose={onClose}
      onSubmit={form.handleSubmit((values) => {
        onSave(values)
        onClose()
      })}
    >
      <FormCheckbox control={form.control} name="stage" label="Pipeline stage bar chart" />
      <FormCheckbox control={form.control} name="trend" label="Follow-up trend line chart" />
      <FormCheckbox control={form.control} name="health" label="Opportunity status donut chart" />
      <FormCheckbox control={form.control} name="owners" label="Owner workload graph" />
    </FormDialog>
  )
}
