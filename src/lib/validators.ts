/** Hard gate G2: format validation for Australian business identifiers. */

const digitsOnly = (value: string) => value.replace(/\s+/g, '')

/** ACN: 9 digits with a valid check digit. */
export function isValidAcn(value: string): boolean {
  const acn = digitsOnly(value)
  if (!/^\d{9}$/.test(acn)) return false
  const weights = [8, 7, 6, 5, 4, 3, 2, 1]
  const sum = weights.reduce((total, weight, index) => total + weight * Number(acn[index]), 0)
  const check = (10 - (sum % 10)) % 10
  return check === Number(acn[8])
}

/** ABN: 11 digits, weighted checksum divisible by 89. */
export function isValidAbn(value: string): boolean {
  const abn = digitsOnly(value)
  if (!/^\d{11}$/.test(abn)) return false
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
  const digits = abn.split('').map(Number)
  digits[0]! -= 1
  const sum = digits.reduce((total, digit, index) => total + digit * weights[index]!, 0)
  return sum % 89 === 0
}

/** Normalises stored identifiers so duplicate checks ignore spacing. */
export const normaliseIdentifier = digitsOnly
