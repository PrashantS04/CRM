import { db, nextId } from '@/mocks/db'
import type { ID, Person, PersonType } from '@/types/domain'
import { notFound, respond } from './http'

export interface CreatePersonInput {
  name: string
  type: PersonType
  email: string
  owner: string
  entityId: ID | null
}

export const peopleApi = {
  list: () => respond(db.people),

  async get(id: ID) {
    const person = db.people.find((p) => p.id === id)
    return person ? respond(person) : notFound('Person', id)
  },

  async create(input: CreatePersonInput) {
    const person: Person = {
      id: nextId('p'),
      name: input.name,
      type: input.type,
      entityId: input.entityId,
      linkRole: 'Other',
      roles: input.type,
      email: input.email,
      phone: '',
      owner: input.owner,
      status: 'Prospect',
    }
    db.people.unshift(person)
    return respond(person)
  },
}
