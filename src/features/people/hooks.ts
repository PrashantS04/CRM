import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { activityApi } from '@/api/activity'
import { peopleApi, type CreatePersonInput } from '@/api/people'
import { queryKeys } from '@/api/queryKeys'
import type { ID } from '@/types/domain'

export const usePeople = () => useQuery({ queryKey: queryKeys.people.all, queryFn: peopleApi.list })

export const usePerson = (id: ID) =>
  useQuery({ queryKey: queryKeys.people.detail(id), queryFn: () => peopleApi.get(id) })

export const usePersonTimeline = (id: ID) =>
  useQuery({
    queryKey: queryKeys.people.timeline(id),
    queryFn: () => activityApi.personTimeline(id),
  })

export function useCreatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePersonInput) => peopleApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.people.all }),
  })
}
