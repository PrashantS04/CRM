import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { ButtonLink, Card, CardHeader } from '@/components/ui'

export function NotFoundPage() {
  return (
    <Card padded>
      <CardHeader
        title="Page not found"
        description="The page you are looking for does not exist."
      />
      <ButtonLink to="/dashboard" variant="primary">
        Go to dashboard
      </ButtonLink>
    </Card>
  )
}

/** Shown when a route throws while loading or rendering. */
export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unexpected error'
  return (
    <main className="mx-auto max-w-xl p-8">
      <Card padded>
        <CardHeader title="Something went wrong" description={message} />
        <ButtonLink to="/dashboard" variant="primary">
          Back to dashboard
        </ButtonLink>
      </Card>
    </main>
  )
}
