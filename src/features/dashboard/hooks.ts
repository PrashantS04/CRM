import { useQuery } from '@tanstack/react-query'
import { dashboardsApi } from '@/api/dashboards'
import { queryKeys } from '@/api/queryKeys'
import type { OpportunityKind } from '@/types/domain'

export const useDashboard = (kind: OpportunityKind) =>
  useQuery({ queryKey: queryKeys.dashboards.detail(kind), queryFn: () => dashboardsApi.get(kind) })
