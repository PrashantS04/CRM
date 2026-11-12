import { normaliseIdentifier } from '@/lib/validators'
import { db, nextId } from '@/mocks/db'
import type { Entity, EntityType, ID } from '@/types/domain'
import { ApiError, notFound, respond } from './http'

export interface CreateEntityInput {
  name: string
  type: EntityType
  acn: string
  abn: string
  owner: string
}

export const entitiesApi = {
  list: () => respond(db.entities),

  async get(id: ID) {
    const entity = db.entities.find((e) => e.id === id)
    return entity ? respond(entity) : notFound('Entity', id)
  },

  /** Hard gate G1: a duplicate ACN or ABN blocks the save. */
  async create(input: CreateEntityInput) {
    const acn = normaliseIdentifier(input.acn)
    const abn = normaliseIdentifier(input.abn)
    if (acn && db.entities.some((e) => normaliseIdentifier(e.acn) === acn)) {
      throw new ApiError('DUPLICATE_ACN', 'An Entity with this ACN already exists.', 'acn')
    }
    if (abn && db.entities.some((e) => normaliseIdentifier(e.abn) === abn)) {
      throw new ApiError('DUPLICATE_ABN', 'An Entity with this ABN already exists.', 'abn')
    }
    const entity: Entity = {
      id: nextId('e'),
      name: input.name,
      type: input.type,
      acn: input.acn,
      abn: input.abn,
      relationship: 'Not yet known',
      owner: input.owner,
      status: 'Prospect',
    }
    db.entities.unshift(entity)
    return respond(entity)
  },
}
