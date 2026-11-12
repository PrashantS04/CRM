import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { activityApi } from '@/api/activity'
import { queryKeys } from '@/api/queryKeys'
import { tasksApi, type CreateTaskInput } from '@/api/tasks'
import type { ID, TaskStatus } from '@/types/domain'

export const useTasks = () => useQuery({ queryKey: queryKeys.tasks.all, queryFn: tasksApi.list })

export const useTask = (id: ID) =>
  useQuery({ queryKey: queryKeys.tasks.detail(id), queryFn: () => tasksApi.get(id) })

export const useTaskHistory = (id: ID) =>
  useQuery({ queryKey: queryKeys.tasks.history(id), queryFn: () => activityApi.taskHistory(id) })

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  })
}

export function useSetTaskStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: ID; status: TaskStatus }) => tasksApi.setStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  })
}
