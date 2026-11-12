import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fieldMapApi } from '@/api/fieldMap'
import { pipelinesApi } from '@/api/pipelines'
import { queryKeys } from '@/api/queryKeys'
import type { ID, PipelineDefinition, PipelineKind } from '@/types/domain'

export const useStageFields = () =>
  useQuery({ queryKey: queryKeys.pipelines.stageFields, queryFn: pipelinesApi.stageFields })

export const useFieldMapCatalog = () =>
  useQuery({ queryKey: queryKeys.fieldMap.catalog, queryFn: fieldMapApi.catalog })

export const useValidationRules = () =>
  useQuery({ queryKey: queryKeys.fieldMap.validations, queryFn: fieldMapApi.validationRules })

/** Mutation that refreshes the pipeline list on success. */
function usePipelineMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<PipelineDefinition>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.all }),
  })
}

export const useCreatePipeline = () =>
  usePipelineMutation((input: { name: string; kind: PipelineKind; firstStage: string }) =>
    pipelinesApi.create(input),
  )

export const useAddStage = () =>
  usePipelineMutation(({ id, stage }: { id: ID; stage: string }) =>
    pipelinesApi.addStage(id, stage),
  )

export const useMoveStage = () =>
  usePipelineMutation(({ id, index, direction }: { id: ID; index: number; direction: -1 | 1 }) =>
    pipelinesApi.moveStage(id, index, direction),
  )
