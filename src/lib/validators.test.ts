import { isValidAbn, isValidAcn } from './validators'

// 000 000 019 is a well-known valid ACN; 51 824 753 556 is the ATO's published sample ABN.
describe('isValidAcn', () => {
  it('accepts a valid ACN, with or without spaces', () => {
    expect(isValidAcn('000000019')).toBe(true)
    expect(isValidAcn('000 000 019')).toBe(true)
  })

  it('rejects a wrong check digit, wrong length and non-digits', () => {
    expect(isValidAcn('000000018')).toBe(false)
    expect(isValidAcn('12345')).toBe(false)
    expect(isValidAcn('abcdefghi')).toBe(false)
  })
})

describe('isValidAbn', () => {
  it('accepts a valid ABN, with or without spaces', () => {
    expect(isValidAbn('51824753556')).toBe(true)
    expect(isValidAbn('51 824 753 556')).toBe(true)
  })

  it('rejects a wrong checksum and wrong length', () => {
    expect(isValidAbn('51824753557')).toBe(false)
    expect(isValidAbn('1234')).toBe(false)
  })
})
