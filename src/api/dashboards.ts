import { DASHBOARDS } from '@/mocks/data'
import type { OpportunityKind } from '@/types/domain'
import { respond } from './http'

export const dashboardsApi = {
  get: (kind: OpportunityKind) => respond(DASHBOARDS[kind]),
}
