import Alert from '@mui/material/Alert'
import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { PageLoader } from './PageLoader'

export interface QueryStateProps<T> {
  query: Pick<UseQueryResult<T>, 'data' | 'isPending' | 'isError' | 'error'>
  children: (data: T) => ReactNode
}

/** Renders loading and error states for a query so pages only handle the happy path. */
export function QueryState<T>({ query, children }: QueryStateProps<T>) {
  if (query.isPending) return <PageLoader />
  if (query.isError || query.data === undefined) {
    return (
      <Alert severity="error">
        {query.error instanceof Error ? query.error.message : 'Something went wrong.'}
      </Alert>
    )
  }
  return <>{children(query.data)}</>
}
