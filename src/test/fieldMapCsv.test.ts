import { loadFieldMap, need, parseFieldMap, rowValues } from './fieldMapCsv'

describe('field map CSV reader', () => {
  it('reads quoted cells with commas, doubled quotes and line breaks, and skips blank rows', () => {
    const rows = parseFieldMap(
      '"Object","Field","Field Type","Required"\n' +
        '"Contact","A, B","Text","Required"\n' +
        '"","","",""\n' +
        '"Contact","Say ""hi""","Text","Required/Opted in\nRqeuired/Opted out"\r\n' +
        '"Note","Subject","Text","Required"',
    )
    expect(rows.map((r) => r.field)).toEqual(['A, B', 'Say "hi"', 'Subject'])
    expect(rows[1]!.required).toBe('Required/Opted in\nRqeuired/Opted out')
    expect(rows[2]!.line).toBe(6)
  })

  it('splits values on ";" when the client used it, else on ","', () => {
    expect(rowValues({ picklistValues: 'Hot , Warm, Cold' })).toEqual(['Hot', 'Warm', 'Cold'])
    expect(rowValues({ picklistValues: 'Business News; Introducer - Ethium; Mailchimp' })).toHaveLength(3)
    expect(rowValues({ picklistValues: 'Active, Inactive, Pending, Suspended' })).toContain('Suspended')
    expect(rowValues({ picklistValues: '' })).toEqual([])
  })

  it.each([
    ['Required', '', 'MANDATORY'],
    ['Optional', '', 'OPTIONAL'],
    ['Required (if Yes)', '', 'CONDITIONAL'],
    ['Required [If preferred channel is Email]', '', 'CONDITIONAL'],
    ['Required', 'Required if preferred channel is email', 'CONDITIONAL'],
    ['Required/Opted in\nRqeuired/Opted out', '', 'CONDITIONAL'],
    ['Dependent', '', 'DEPENDENT'],
    ['System', '', 'SYSTEM'],
  ] as const)('reads Required "%s" as %s', (required, rule, expected) => {
    expect(need(required, rule)).toBe(expected)
  })

  it('reads the issued field map', () => {
    const rows = loadFieldMap()
    expect(rows.length).toBeGreaterThan(80)
    expect(rows[0]).toMatchObject({ object: 'Contact', field: 'Type of contact', required: 'Required', businessUnit: 'Credit' })
  })
})
