import { useEffect } from 'react'
import { z } from 'zod'
import { useToast } from '@/components/feedback/toastContext'
import { FormTextField } from '@/components/form'
import { FormDialog } from '@/components/ui'
import { useAddNote } from '@/hooks/useAddNote'
import { useZodForm } from '@/hooks/useZodForm'
import type { ID } from '@/types/domain'

/** Brief §3.6.1: 32,000+ characters, timestamped, newest first, never deleted. */
export const MAX_NOTE_LENGTH = 32_000

const noteSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Enter a note')
    .max(MAX_NOTE_LENGTH, `Notes are limited to ${MAX_NOTE_LENGTH.toLocaleString()} characters`),
})

export interface NoteDialogProps {
  open: boolean
  recordId: ID
  recordName: string
  onClose: () => void
}

export function NoteDialog({ open, recordId, recordName, onClose }: NoteDialogProps) {
  const toast = useToast()
  const addNote = useAddNote(recordId)
  const form = useZodForm(noteSchema, { text: '' })

  useEffect(() => {
    if (!open) form.reset()
  }, [open, form])

  const submit = form.handleSubmit(async ({ text }) => {
    await addNote.mutateAsync(text)
    toast.success('Note added')
    onClose()
  })

  return (
    <FormDialog
      open={open}
      title={`Add note to ${recordName}`}
      description="Notes are timestamped, append-only and editable by the author for 24 hours."
      submitLabel="Add note"
      onClose={onClose}
      onSubmit={submit}
      isSubmitting={form.formState.isSubmitting}
    >
      <FormTextField control={form.control} name="text" label="Note" multiline fullWidth />
    </FormDialog>
  )
}
