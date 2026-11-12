import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { activityApi } from '@/api/activity'
import { opportunitiesApi, type CreateOpportunityInput } from '@/api/opportunities'
import { pipelinesApi } from '@/api/pipelines'
import { queryKeys } from '@/api/queryKeys'
import type { ID, Opportunity, OpportunityKind } from '@/types/domain'

export const useOpportunities = (kind: OpportunityKind) =>
  useQuery({
    queryKey: queryKeys.opportunities.list(kind),
    queryFn: () => opportunitiesApi.list(kind),
  })

/** Every opportunity regardless of pipeline (used for "related opportunities"). */
export const useAllOpportunities = () =>
  useQuery({ queryKey: queryKeys.opportunities.all, queryFn: opportunitiesApi.listAll })

export const useOpportunity = (id: ID) =>
  useQuery({
    queryKey: queryKeys.opportunities.detail(id),
    queryFn: () => opportunitiesApi.get(id),
  })

export const useOpportunityActivity = (id: ID) =>
  useQuery({
    queryKey: queryKeys.opportunities.activity(id),
    queryFn: () => activityApi.opportunityActivity(id),
  })

export const useOpportunityAudit = (id: ID) =>
  useQuery({
    queryKey: queryKeys.opportunities.audit(id),
    queryFn: () => activityApi.opportunityAudit(id),
  })

export const usePipelines = () =>
  useQuery({ queryKey: queryKeys.pipelines.all, queryFn: pipelinesApi.list })

export function useCreateOpportunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateOpportunityInput & { note?: string }) => {
      const { note, ...rest } = input
      const created = await opportunitiesApi.create(rest)
      if (note) await activityApi.addNote(created.id, note)
      return created
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all }),
  })
}

/** Moves an opportunity to another stage, updating the board immediately (rolls back on error). */
export function useMoveOpportunityStage(kind: OpportunityKind) {
  const queryClient = useQueryClient()
  const listKey = queryKeys.opportunities.list(kind)

  return useMutation({
    mutationFn: ({ id, stage }: { id: ID; stage: string }) => opportunitiesApi.moveStage(id, stage),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const previous = queryClient.getQueryData<Opportunity[]>(listKey)
      queryClient.setQueryData<Opportunity[]>(listKey, (rows) =>
        rows?.map((row) => (row.id === id ? { ...row, stage } : row)),
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all }),
  })
}
