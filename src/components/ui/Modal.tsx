import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import { X } from 'lucide-react'
import { useId, type FormEventHandler, type ReactNode } from 'react'
import { Button } from './Button'

export interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** Footer content; omit for no footer. */
  footer?: ReactNode
  maxWidth?: number
}

/** Dialog shell with title bar, close button and optional footer. */
export function Modal({ open, title, onClose, children, footer, maxWidth = 620 }: ModalProps) {
  const titleId = useId()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      fullWidth
      slotProps={{ paper: { sx: { maxWidth, m: 2, width: '100%' } } }}
    >
      <div className="border-line flex items-center justify-between border-b px-[22px] py-[19px]">
        <h2 id={titleId} className="text-ink m-0 text-base font-bold">
          {title}
        </h2>
        <IconButton aria-label="Close dialog" onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </div>
      {children}
      {footer && (
        <div className="border-line flex justify-end gap-2 border-t px-[22px] py-[15px]">
          {footer}
        </div>
      )}
    </Dialog>
  )
}

export interface FormDialogProps {
  open: boolean
  title: string
  description?: string
  submitLabel: string
  onClose: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  isSubmitting?: boolean
  children: ReactNode
}

/** Modal wrapping a `<form>`: two-column field grid plus Cancel / Submit footer. */
export function FormDialog({
  open,
  title,
  description,
  submitLabel,
  onClose,
  onSubmit,
  isSubmitting = false,
  children,
}: FormDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <div className="grid gap-3.5 p-[22px] sm:grid-cols-2">
          {description && <p className="text-muted col-span-full m-0 text-[13px]">{description}</p>}
          {children}
        </div>
        <div className="border-line flex justify-end gap-2 border-t px-[22px] py-[15px]">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
