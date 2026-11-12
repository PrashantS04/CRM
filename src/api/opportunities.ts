import { db, nextId } from '@/mocks/db'
import type {
  ID,
  LeadCategory,
  LeadStatus,
  Opportunity,
  OpportunityKind,
  OpportunitySource,
} from '@/types/domain'
import { ApiError, notFound, respond } from './http'

export interface CreateOpportunityInput {
  kind: OpportunityKind
  name: string
  party: string
  owner: string
  source: OpportunitySource
  amount: number | null
  leadCategory: LeadCategory
  leadStatus: LeadStatus
  stage: string
}

const PIPELINE_ID: Record<OpportunityKind, string> = { loan: 'loan', investment: 'investment' }

export const opportunitiesApi = {
  listAll: () => respond(db.opportunities),

  list: (kind: OpportunityKind) => respond(db.opportunities.filter((o) => o.kind === kind)),

  async get(id: ID) {
    const opportunity = db.opportunities.find((o) => o.id === id)
    return opportunity ? respond(opportunity) : notFound('Opportunity', id)
  },

  async create(input: CreateOpportunityInput) {
    const opportunity: Opportunity = {
      ...input,
      id: nextId('o'),
      createdAt: new Date().toISOString(),
      followUpAt: null,
    }
    db.opportunities.unshift(opportunity)
    return respond(opportunity)
  },

  /** Stage moves never block (brief §2.4); the stage only has to exist in the pipeline. */
  async moveStage(id: ID, stage: string) {
    const opportunity = db.opportunities.find((o) => o.id === id)
    if (!opportunity) return notFound('Opportunity', id)
    const pipeline = db.pipelines.find((p) => p.id === PIPELINE_ID[opportunity.kind])
    if (!pipeline?.stages.includes(stage)) {
      throw new ApiError('INVALID_STAGE', `"${stage}" is not a stage of this pipeline.`)
    }
    opportunity.stage = stage
    return respond(opportunity)
  },
}
