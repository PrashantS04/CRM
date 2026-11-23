import { CalendarClock, Download, Plus } from 'lucide-react'
import { useToast } from '@/components/feedback/toastContext'
import { Button, Card, CardGrid, CardHeader, PageHeader } from '@/components/ui'

const REPORTS = [
  {
    title: 'Loan Report 1: New Enquiries & Lost',
    description:
      'Identity, tranche financials, totals, lost reason, full lost description, appetite band and stage at exit.',
  },
  {
    title: 'Loan Report 2: Pipeline Updates',
    description:
      'Open deals, tranche financials, priority, stage, probability, appetite band and days in stage.',
  },
  {
    title: 'Capital Report 1: New & Lost/Dormant',
    description:
      'Investor, source, frozen investor type, channel, indicative amount, dormant reason and description.',
  },
  {
    title: 'Capital Report 2: Pipeline Updates',
    description:
      'Investor, stage weighting, age, channel, target and separate indicative/committed/funded amounts.',
  },
] as const

export function ReportsPage() {
  const toast = useToast()
  return (
    <>
      <PageHeader
        title="Reports"
        description="Scheduled, filterable reports with row counts, totals, runtime and audited exports."
        actions={
          <Button
            variant="primary"
            startIcon={<Plus size={16} />}
            onClick={() => toast.info('Report schedule editor opened')}
          >
            Schedule report
          </Button>
        }
      />
      <CardGrid columns={2}>
        {REPORTS.map((report) => (
          <Card key={report.title} padded>
            <CardHeader title={report.title} description={report.description} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => toast.info(`${report.title} report opened`)}>Run</Button>
              <Button
                startIcon={<Download size={14} />}
                onClick={() => toast.success('XLS / CSV list export logged in audit trail')}
              >
                XLS / CSV
              </Button>
              <Button
                variant="primary"
                startIcon={<CalendarClock size={14} />}
                onClick={() => toast.success('PDF report export with charts logged in audit trail')}
              >
                PDF
              </Button>
            </div>
          </Card>
        ))}
      </CardGrid>
    </>
  )
}
