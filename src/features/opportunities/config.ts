import type { OpportunityKind, PipelineKind } from '@/types/domain'

export interface OpportunityKindConfig {
  /** Pipeline id in the pipeline store. */
  pipelineId: OpportunityKind
  pipelineKind: PipelineKind
  /** "Loan Opportunity" */
  singular: string
  /** "Loan Opportunities" */
  plural: string
  /** "Loan" / "Investment" */
  short: string
  basePath: string
  dashboardPath: string
  /** Label for the counterparty field. */
  partyLabel: 'Borrower' | 'Investor'
  /** Dashboard role options (prototype). */
  roles: readonly [string, string]
}

/** Everything that differs between the two pipelines lives here (Credit vs Capital). */
export const OPPORTUNITY_KINDS: Record<OpportunityKind, OpportunityKindConfig> = {
  loan: {
    pipelineId: 'loan',
    pipelineKind: 'Credit',
    singular: 'Loan Opportunity',
    plural: 'Loan Opportunities',
    short: 'Loan',
    basePath: '/loan-opportunities',
    dashboardPath: '/dashboard/loan',
    partyLabel: 'Borrower',
    roles: ['Credit Team', 'Credit Manager'],
  },
  investment: {
    pipelineId: 'investment',
    pipelineKind: 'Capital',
    singular: 'Investment Opportunity',
    plural: 'Investment Opportunities',
    short: 'Investment',
    basePath: '/investment-opportunities',
    dashboardPath: '/dashboard/investment',
    partyLabel: 'Investor',
    roles: ['Investor Relations', 'Capital Manager'],
  },
}

export const detailPath = (kind: OpportunityKind, id: string) =>
  `${OPPORTUNITY_KINDS[kind].basePath}/${id}`
