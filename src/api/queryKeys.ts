import type { ID, OpportunityKind } from '@/types/domain'

/** Central query-key factory so invalidation never relies on string typos. */
export const queryKeys = {
  people: {
    all: ['people'] as const,
    detail: (id: ID) => ['people', id] as const,
    timeline: (id: ID) => ['people', id, 'timeline'] as const,
  },
  entities: {
    all: ['entities'] as const,
    detail: (id: ID) => ['entities', id] as const,
  },
  opportunities: {
    all: ['opportunities'] as const,
    list: (kind: OpportunityKind) => ['opportunities', 'list', kind] as const,
    detail: (id: ID) => ['opportunities', id] as const,
    activity: (id: ID) => ['opportunities', id, 'activity'] as const,
    audit: (id: ID) => ['opportunities', id, 'audit'] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    detail: (id: ID) => ['tasks', id] as const,
    history: (id: ID) => ['tasks', id, 'history'] as const,
  },
  pipelines: { all: ['pipelines'] as const, stageFields: ['pipelines', 'stage-fields'] as const },
  dashboards: { detail: (kind: OpportunityKind) => ['dashboards', kind] as const },
  fieldMap: { catalog: ['field-map'] as const, validations: ['validation-rules'] as const },
}
