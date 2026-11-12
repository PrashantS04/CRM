import { entitySchema } from './schema'

const base = {
  name: 'Acme Pty Ltd',
  type: 'Developer' as const,
  acn: '',
  abn: '',
  owner: 'Alex Stewart',
}

describe('entitySchema (hard gate G2)', () => {
  it('accepts a valid Entity with blank ACN/ABN', () => {
    expect(entitySchema.safeParse(base).success).toBe(true)
  })

  it('accepts valid identifiers', () => {
    expect(
      entitySchema.safeParse({ ...base, acn: '000 000 019', abn: '51 824 753 556' }).success,
    ).toBe(true)
  })

  it('names the field when the ACN format is invalid', () => {
    const result = entitySchema.safeParse({ ...base, acn: '123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]).toMatchObject({
      path: ['acn'],
      message: expect.stringContaining('ACN'),
    })
  })

  it('names the field when the ABN format is invalid', () => {
    const result = entitySchema.safeParse({ ...base, abn: '123' })
    expect(result.error?.issues[0]).toMatchObject({
      path: ['abn'],
      message: expect.stringContaining('ABN'),
    })
  })

  it('requires a name', () => {
    expect(entitySchema.safeParse({ ...base, name: '  ' }).success).toBe(false)
  })
})
