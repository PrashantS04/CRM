import { Card, CardHeader, PageHeader } from '@/components/ui'

export function DashboardHomePage() {
  return (
    <>
      <PageHeader
        title="Dashboards"
        description="Use the Dashboard submenu to open your Loan Opportunities or Investment Opportunities dashboard."
      />
      <Card padded>
        <CardHeader
          title="Dashboard navigation"
          description="Each dashboard shows only its own pipeline. The Custom Dashboard option is currently unavailable."
        />
      </Card>
    </>
  )
}
