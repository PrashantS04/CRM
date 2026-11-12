import { useEffect } from 'react'
import { z } from 'zod'
import { useToast } from '@/components/feedback/toastContext'
import { FormSelect, FormTextField } from '@/components/form'
import { FormDialog } from '@/components/ui'
import { CURRENT_USER, OWNERS, TASK_PRIORITIES } from '@/constants/lists'
import { useZodForm } from '@/hooks/useZodForm'
import type { TaskArea } from '@/types/domain'
import { useCreateTask } from './hooks'

const taskSchema = z.object({
  title: z.string().trim().min(1, 'Enter a task title'),
  relatedTo: z.string().trim(),
  assignee: z.string().min(1, 'Choose an assignee'),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: z.string().min(1, 'Choose a due date'),
})

export interface NewTaskDialogProps {
  open: boolean
  onClose: () => void
  /** Record the task is created from (Person, Entity or Opportunity name). */
  relatedTo?: string
  area?: TaskArea
}

export function NewTaskDialog({
  open,
  onClose,
  relatedTo = '',
  area = 'People',
}: NewTaskDialogProps) {
  const toast = useToast()
  const createTask = useCreateTask()
  const defaults = {
    title: '',
    relatedTo,
    assignee: CURRENT_USER,
    priority: 'Normal' as const,
    dueDate: '',
  }
  const form = useZodForm(taskSchema, defaults)

  useEffect(() => {
    if (open) form.reset({ ...defaults })
    // eslint-disable-next-line react/exhaustive-deps -- reset only when the dialog opens
  }, [open, relatedTo])

  const submit = form.handleSubmit(async (values) => {
    await createTask.mutateAsync({
      title: values.title,
      relatedTo: values.relatedTo || 'Not linked',
      area,
      assignee: values.assignee,
      priority: values.priority,
      dueAt: new Date(`${values.dueDate}T17:00:00`).toISOString(),
      createdBy: CURRENT_USER,
    })
    toast.success('Task created')
    onClose()
  })

  return (
    <FormDialog
      open={open}
      title={relatedTo ? `Assign task to ${relatedTo}` : 'New task'}
      description="Tasks can be assigned to any authorised user and will appear in their My tasks list."
      submitLabel="Create task"
      onClose={onClose}
      onSubmit={submit}
      isSubmitting={form.formState.isSubmitting}
    >
      <FormTextField
        control={form.control}
        name="title"
        label="Task title"
        placeholder="Enter task title"
        fullWidth
      />
      <FormSelect control={form.control} name="assignee" label="Assignee" options={OWNERS} />
      <FormSelect
        control={form.control}
        name="priority"
        label="Priority"
        options={TASK_PRIORITIES}
      />
      <FormTextField control={form.control} name="dueDate" label="Due date" type="date" />
      <FormTextField
        control={form.control}
        name="relatedTo"
        label="Related to"
        placeholder="Person, Entity or opportunity"
      />
    </FormDialog>
  )
}
