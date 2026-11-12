import { resetDatabase } from '@/mocks/db'
import { activityApi } from './activity'
import { entitiesApi } from './entities'
import { ApiError } from './http'
import { opportunitiesApi } from './opportunities'
import { pipelinesApi } from './pipelines'
import { tasksApi } from './tasks'

beforeEach(() => resetDatabase())

const newEntity = {
  name: 'New Co',
  type: 'Developer' as const,
  acn: '',
  abn: '',
  owner: 'Alex Stewart',
}

describe('entitiesApi (hard gate G1)', () => {
  it('blocks a duplicate ACN, ignoring spacing', async () => {
    await expect(entitiesApi.create({ ...newEntity, acn: '618432910' })).rejects.toMatchObject({
      code: 'DUPLICATE_ACN',
      field: 'acn',
    })
  })

  it('blocks a duplicate ABN', async () => {
    await expect(entitiesApi.create({ ...newEntity, abn: '51618432910' })).rejects.toBeInstanceOf(
      ApiError,
    )
  })

  it('saves an Entity with unique identifiers', async () => {
    const created = await entitiesApi.create({ ...newEntity, acn: '000 000 019' })
    expect((await entitiesApi.list()).some((e) => e.id === created.id)).toBe(true)
  })
})

describe('opportunitiesApi', () => {
  it('moves a stage that exists in the pipeline', async () => {
    const moved = await opportunitiesApi.moveStage('o1', 'Booking')
    expect(moved.stage).toBe('Booking')
  })

  it('rejects a stage from another pipeline', async () => {
    await expect(opportunitiesApi.moveStage('o1', 'First Contact')).rejects.toMatchObject({
      code: 'INVALID_STAGE',
    })
  })

  it('lists only the requested kind', async () => {
    const loans = await opportunitiesApi.list('loan')
    expect(loans.length).toBeGreaterThan(0)
    expect(loans.every((o) => o.kind === 'loan')).toBe(true)
  })

  it('reports a missing opportunity as NOT_FOUND', async () => {
    await expect(opportunitiesApi.get('nope')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe('tasksApi', () => {
  it('changes status but never deletes (brief §3.6.5)', async () => {
    const before = (await tasksApi.list()).length
    await tasksApi.setStatus('t1', 'Cancelled')
    const after = await tasksApi.list()
    expect(after).toHaveLength(before)
    expect(after.find((t) => t.id === 't1')?.status).toBe('Cancelled')
  })
})

describe('pipelinesApi', () => {
  it('reorders stages', async () => {
    const before = (await pipelinesApi.list()).find((p) => p.id === 'loan')!.stages
    const after = await pipelinesApi.moveStage('loan', 0, 1)
    expect(after.stages[0]).toBe(before[1])
    expect(after.stages[1]).toBe(before[0])
  })

  it('adds a stage', async () => {
    const pipeline = await pipelinesApi.addStage('investment', 'Reinvested')
    expect(pipeline.stages.at(-1)).toBe('Reinvested')
  })
})

describe('activityApi', () => {
  it('shows a new note first (newest first)', async () => {
    await activityApi.addNote('o1', 'Hello world')
    const items = await activityApi.opportunityActivity('o1')
    expect(items[0]).toMatchObject({ kind: 'note', detail: '“Hello world”' })
  })
})
