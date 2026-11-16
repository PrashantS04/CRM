import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi, type CreateTaskInput } from '@/api/tasks'
import { queryKeys } from '@/api/queryKeys'

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  })
}
