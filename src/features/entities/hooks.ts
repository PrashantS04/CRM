import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { entitiesApi, type CreateEntityInput } from '@/api/entities'
import { queryKeys } from '@/api/queryKeys'
import type { ID } from '@/types/domain'

export const useEntities = () =>
  useQuery({ queryKey: queryKeys.entities.all, queryFn: entitiesApi.list })

export const useEntity = (id: ID) =>
  useQuery({ queryKey: queryKeys.entities.detail(id), queryFn: () => entitiesApi.get(id) })

export function useCreateEntity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateEntityInput) => entitiesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.entities.all }),
  })
}
