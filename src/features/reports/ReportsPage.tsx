import { Plus } from 'lucide-react'
import { useToast } from '@/components/feedback/toastContext'
import { Button, Card, CardGrid, CardHeader, PageHeader } from '@/components/ui'

const REPORTS = [
  {
    title: 'Weekly loan pipeline',
    description: 'Open opportunities, stage, days in stage, weighted value and follow-up status.',
    message: 'Loan pipeline report opened',
  },
  {
    title: 'Capital pipeline updates',
    description: 'Open Investment Opportunities with indicative, committed and funded amounts.',
    message: 'Capital pipeline report opened',
  },
  {
    title: 'New and lost records',
    description: 'Created records and closed or dormant records within a selected period.',
    message: 'New and lost report opened',
  },
] as const

export function ReportsPage() {
  const toast = useToast()
  return (
    <>
      <PageHeader
        title="Reports"
        description="Run pipeline reports, apply filters and export permitted results."
        actions={
          <Button
            variant="primary"
            startIcon={<Plus size={16} />}
            onClick={() => toast.info('Report builder opened')}
          >
            Create report
          </Button>
        }
      />
      <CardGrid>
        {REPORTS.map((report) => (
          <Card key={report.title} padded>
            <CardHeader title={report.title} description={report.description} />
            <Button onClick={() => toast.info(report.message)}>Run report</Button>
          </Card>
        ))}
      </CardGrid>
    </>
  )
}
