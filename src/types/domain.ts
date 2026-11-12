/** Domain types. Vocabulary follows Appendix A of the design brief (Entity, Person, Loan Opportunity...). */

export type ID = string

export type RelationshipStatus = 'Prospect' | 'Active' | 'Inactive'

export type PersonType =
  | 'Broker'
  | 'Borrower or Sponsor'
  | 'Investor'
  | 'Introducer or Adviser'
  | 'Service provider'
  | 'PrivateInvest staff'
  | 'Not yet known'

export type EntityType =
  | 'Aggregator Group'
  | 'Broker Firm'
  | 'Developer'
  | 'Builder'
  | 'Client-Facing Firm'
  | 'Family Office'
  | 'Distributor'
  | 'Consultant'
  | 'Other'
  | 'Not yet known'

export interface Person {
  id: ID
  name: string
  type: PersonType
  /** Primary Entity link; `null` until one is made. */
  entityId: ID | null
  /** Role on the primary Entity link (Director, Broker...). */
  linkRole: string
  /** Free-text roles summary shown in lists. */
  roles: string
  email: string
  phone: string
  owner: string
  status: RelationshipStatus
}

export interface Entity {
  id: ID
  name: string
  type: EntityType
  acn: string
  abn: string
  relationship: string
  owner: string
  status: RelationshipStatus
}

export type OpportunityKind = 'loan' | 'investment'
export type LeadCategory = 'Lead' | 'Qualified lead' | 'Opportunity'
export type LeadStatus = 'Suspect' | 'Prospect' | 'Qualified' | 'Disqualified'
export type OpportunitySource = 'Direct' | 'Broker' | 'Introducer'

export interface Opportunity {
  id: ID
  name: string
  /** Borrower (loan) or Investor (investment) display name. */
  party: string
  kind: OpportunityKind
  stage: string
  /** AUD, stored exactly. `null` means not entered yet. */
  amount: number | null
  owner: string
  createdAt: string
  followUpAt: string | null
  leadCategory: LeadCategory
  leadStatus: LeadStatus
  source: OpportunitySource
}

export type TaskPriority = 'High' | 'Normal' | 'Low'
export type TaskStatus = 'Open' | 'In Progress' | 'Done' | 'Cancelled'
export type TaskArea = 'Credit' | 'Capital' | 'People'

export interface Task {
  id: ID
  title: string
  relatedTo: string
  area: TaskArea
  createdBy: string
  createdAt: string
  assignee: string
  priority: TaskPriority
  status: TaskStatus
  dueAt: string
}

export type ActivityKind = 'task' | 'event' | 'email' | 'call' | 'note'

export interface ActivityItem {
  id: ID
  kind: ActivityKind
  title: string
  detail: string
  meta: string
  status: string
  group: string
  /** Render the status label in the brand colour (e.g. Overdue). */
  alert?: boolean
}

export interface TimelineEntry {
  id: ID
  title: string
  detail: string
}

export type PipelineKind = 'Credit' | 'Capital' | 'Custom'

export interface PipelineDefinition {
  id: ID
  name: string
  kind: PipelineKind
  stages: string[]
}

export interface StageField {
  name: string
  type: string
  required: 'Yes' | 'No'
  validation: string
}

export interface FieldMapRow {
  field: string
  type: string
  required: string
  rule: string
}

export interface StageMetric {
  stage: string
  count: number
  /** AUD. */
  value: number
}

export interface DashboardData {
  openPipeline: number
  followUpsOverdue: number
  openTasks: number
  stages: StageMetric[]
  health: { onTrack: number; dueSoon: number; overdue: number }
  trend: { week: string; created: number; followUpsCompleted: number }[]
}
