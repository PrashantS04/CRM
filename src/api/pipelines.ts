import { DEFAULT_STAGE_FIELDS } from '@/mocks/data'
import { db } from '@/mocks/db'
import type { ID, PipelineDefinition, PipelineKind, StageField } from '@/types/domain'
import { notFound, respond } from './http'

function findPipeline(id: ID): PipelineDefinition {
  const pipeline = db.pipelines.find((p) => p.id === id)
  return pipeline ?? notFound('Pipeline', id)
}

export const pipelinesApi = {
  list: () => respond(db.pipelines),

  async create(input: { name: string; kind: PipelineKind; firstStage: string }) {
    const pipeline: PipelineDefinition = {
      id: `custom-${Date.now()}`,
      name: input.name,
      kind: input.kind,
      stages: [input.firstStage],
    }
    db.pipelines.push(pipeline)
    return respond(pipeline)
  },

  async addStage(id: ID, stage: string) {
    const pipeline = findPipeline(id)
    pipeline.stages.push(stage)
    return respond(pipeline)
  },

  /** Moves a stage up (-1) or down (+1). */
  async moveStage(id: ID, index: number, direction: -1 | 1) {
    const pipeline = findPipeline(id)
    const target = index + direction
    if (target >= 0 && target < pipeline.stages.length) {
      const stages = pipeline.stages
      ;[stages[index], stages[target]] = [stages[target]!, stages[index]!]
    }
    return respond(pipeline)
  },

  /** Moves the stage at `index` to position `to`. */
  async reorderStage(id: ID, index: number, to: number) {
    const pipeline = findPipeline(id)
    const stages = pipeline.stages
    const [stage] = stages.splice(index, 1)
    if (stage !== undefined) stages.splice(Math.min(to, stages.length), 0, stage)
    return respond(pipeline)
  },

  stageFields: (): Promise<StageField[]> => respond(DEFAULT_STAGE_FIELDS),
}
