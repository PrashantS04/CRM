import type {
  EntityType,
  LeadCategory,
  LeadStatus,
  OpportunitySource,
  PersonType,
  RelationshipStatus,
  TaskPriority,
  TaskStatus,
} from '@/types/domain'

/** Admin-editable lists in the real product (brief §2.2); static here. */
export const OWNERS = ['Alex Stewart', 'J. Davies', 'M. Khan', 'Sarah Chen'] as const
export const CURRENT_USER = 'Alex Stewart'

export const PERSON_TYPES: readonly PersonType[] = [
  'Broker',
  'Borrower or Sponsor',
  'Investor',
  'Introducer or Adviser',
  'Service provider',
  'PrivateInvest staff',
  'Not yet known',
]

export const ENTITY_TYPES: readonly EntityType[] = [
  'Aggregator Group',
  'Broker Firm',
  'Developer',
  'Builder',
  'Client-Facing Firm',
  'Family Office',
  'Distributor',
  'Consultant',
  'Other',
  'Not yet known',
]

export const RELATIONSHIP_STATUSES: readonly RelationshipStatus[] = [
  'Prospect',
  'Active',
  'Inactive',
]
export const LEAD_CATEGORIES: readonly LeadCategory[] = ['Lead', 'Qualified lead', 'Opportunity']
export const LEAD_STATUSES: readonly LeadStatus[] = [
  'Suspect',
  'Prospect',
  'Qualified',
  'Disqualified',
]
export const OPPORTUNITY_SOURCES: readonly OpportunitySource[] = ['Direct', 'Broker', 'Introducer']
export const TASK_PRIORITIES: readonly TaskPriority[] = ['High', 'Normal', 'Low']
export const TASK_STATUSES: readonly TaskStatus[] = ['Open', 'In Progress', 'Done', 'Cancelled']

export const FIELD_TYPES = [
  'Text',
  'Numeric',
  'Boolean',
  'Date',
  'Single select',
  'Multi select',
  'Checkbox group',
  'Radio group',
  'Long text',
] as const
