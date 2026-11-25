import { useMutation, useQueryClient } from '@tanstack/react-query'
import { activityApi } from '@/api/activity'
import { queryKeys } from '@/api/queryKeys'
import type { ID } from '@/types/domain'

/** Adds a Note to a record and refreshes whichever timeline shows it. */
export function useAddNote(recordId: ID) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (text: string) => activityApi.addNote(recordId, text),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.people.timeline(recordId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.activity(recordId) }),
      ]),
  })
}
