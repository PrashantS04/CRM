import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { downloadRows, type ExportFormat } from '@/lib/export'

export interface ExportDialogProps {
  open: boolean
  /** Name of what is being exported, e.g. "People". */
  subject: string
  /** Filtered rows to export (CSV/XLS are list-only). */
  rows: readonly Record<string, unknown>[]
  onClose: () => void
}

/** Export picker. CSV and XLS download the filtered list; PDF is a server feature. */
export function ExportDialog({ open, subject, rows, onClose }: ExportDialogProps) {
  const toast = useToast()

  const run = (format: ExportFormat) => {
    if (format === 'pdf') {
      toast.info(
        'PDF export includes the selected dashboard charts and a data summary (server-side feature).',
      )
    } else {
      downloadRows(subject.toLowerCase().replaceAll(' ', '-'), rows, format)
      toast.success(`${subject} exported as ${format.toUpperCase()}.`)
    }
    onClose()
  }

  return (
    <Modal open={open} title={`Export ${subject}`} onClose={onClose} maxWidth={460}>
      <div className="grid gap-3.5 p-[22px]">
        <p className="text-muted m-0 text-[13px]">
          CSV and XLS include only the filtered list rows. PDF includes a list plus dashboard
          charts.
        </p>
        <Button onClick={() => run('csv')}>Download CSV list</Button>
        <Button onClick={() => run('xls')}>Download XLS list</Button>
        <Button variant="primary" onClick={() => run('pdf')}>
          Export PDF with charts
        </Button>
      </div>
    </Modal>
  )
}
