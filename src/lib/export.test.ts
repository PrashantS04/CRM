import { toCsv } from './export'

describe('toCsv', () => {
  it('writes a header row and quotes every cell', () => {
    expect(toCsv([{ name: 'Alex', stage: 'Enquiry' }])).toBe('name,stage\n"Alex","Enquiry"')
  })

  it('escapes embedded quotes and tolerates null values', () => {
    expect(toCsv([{ note: 'He said "hi"', amount: null }])).toBe('note,amount\n"He said ""hi""",""')
  })

  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('')
  })
})
