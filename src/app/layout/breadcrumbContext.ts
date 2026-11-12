import { createContext, useContext, useEffect } from 'react'

export interface BreadcrumbApi {
  tail: string | null
  setTail: (label: string | null) => void
}

export const BreadcrumbContext = createContext<BreadcrumbApi | null>(null)

/** Lets a detail page append its record name to the top-bar breadcrumb. */
export function usePageCrumb(label: string | undefined): void {
  const context = useContext(BreadcrumbContext)
  const setTail = context?.setTail
  useEffect(() => {
    if (!setTail || !label) return
    setTail(label)
    return () => setTail(null)
  }, [setTail, label])
}
