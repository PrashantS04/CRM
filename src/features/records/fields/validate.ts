import { abnError, acnError, isRequiredNow, isVisible, listItems, type RecordContext } from './logic'
import { isComputed, type DataType, type FieldDef, type Values } from './types'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^[0-9 +()-]{6,30}$/

export const isEmptyValue = (v: unknown) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0)

export const isNumeric = (t: DataType) => t === 'NUMBER' || t === 'CURRENCY' || t === 'PERCENT'
export const isTextType = (t: DataType) => t === 'TEXT' || t === 'LONG_TEXT' || t === 'EMAIL' || t === 'PHONE' || t === 'URL'

/**
 * Client-side check of one value against its field definition: the same rules the server applies (required,
 * type format, length, decimals, min/max, pattern). The server stays the authority; this only saves a round trip.
 */
export function validateValue(f: Pick<FieldDef, 'label' | 'dataType' | 'mandatory' | 'maxLength' | 'decimalPlaces' | 'validation'>, v: unknown): string | undefined {
  if (f.dataType === 'PHONE_LIST' || f.dataType === 'EMAIL_LIST') {
    const items = listItems(v).filter((i) => !isEmptyValue(i.value))
    if (!items.length) return f.mandatory ? `${f.label} is required.` : undefined
    const itemType: DataType = f.dataType === 'PHONE_LIST' ? 'PHONE' : 'EMAIL'
    const seen = new Set<string>()
    for (const i of items) {
      if (!i.label) return `Choose a label for ${i.value}.`
      const e = validateValue({ label: f.label, dataType: itemType, mandatory: false, maxLength: null, decimalPlaces: null, validation: {} }, i.value)
      if (e) return `${i.value}: ${e}`
      const key = itemType === 'PHONE' ? i.value.replace(/\D/g, '') : i.value.trim().toLowerCase()
      if (seen.has(key)) return `${i.value.trim()} is listed twice.`
      seen.add(key)
    }
    if (items.filter((i) => i.primary).length > 1) return `Mark one ${itemType === 'PHONE' ? 'phone number' : 'email address'} as primary.`
    return undefined
  }
  if (isEmptyValue(v) || (f.dataType === 'CHECKBOX' && v !== true)) {
    return f.mandatory ? `${f.label} is required.` : undefined
  }
  const rules = f.validation ?? {}
  if (rules.format === 'ABN' && typeof v === 'string') return abnError(v)
  if (rules.format === 'ACN' && typeof v === 'string') return acnError(v)
  if (isTextType(f.dataType)) {
    const s = String(v).trim()
    const max = f.maxLength ?? (f.dataType === 'TEXT' ? 255 : f.dataType === 'LONG_TEXT' ? 32000 : undefined)
    if (max && s.length > max) return `Use at most ${max} characters (this has ${s.length}).`
    if (f.dataType === 'EMAIL' && !EMAIL.test(s)) return 'This email address is not in a valid format.'
    if (f.dataType === 'PHONE') {
      const digits = s.replace(/\D/g, '').length
      if (!PHONE.test(s)) return 'Enter a phone number using digits, spaces, +, ( ) or -.'
      if (digits < 6 || digits > 15) return 'A phone number has 6 to 15 digits.'
    }
    if (f.dataType === 'URL' && (/\s/.test(s) || !s.includes('.'))) return 'Enter a web address, e.g. example.com.au.'
    if (rules.minLength && s.length < rules.minLength) return `Use at least ${rules.minLength} characters.`
    if (rules.pattern) {
      try {
        if (!new RegExp(`^(?:${rules.pattern})$`).test(s)) return rules.patternMessage || 'This value is not in the expected format.'
      } catch {
        // The server checks patterns too; a pattern the browser can't read is left to it.
      }
    }
  }
  if (isNumeric(f.dataType)) {
    const n = Number(String(v).replace(/,/g, ''))
    if (!Number.isFinite(n)) return 'Enter a number.'
    const decimals = f.decimalPlaces ?? 2
    const frac = String(v).split('.')[1]?.replace(/0+$/, '') ?? ''
    if (frac.length > decimals) return decimals === 0 ? 'Enter a whole number.' : `Use at most ${decimals} decimal places.`
    if (rules.min !== undefined && n < rules.min) return `Enter a number of ${rules.min} or more.`
    if (rules.max !== undefined && n > rules.max) return `Enter a number of ${rules.max} or less.`
  }
  if (f.dataType === 'DATE' && !/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return 'Enter a date as YYYY-MM-DD.'
  return undefined
}

/**
 * Checks a form: fields its conditions hide and CRM-set fields are skipped, a field is required when it is
 * mandatory or its requiredWhen conditions hold, and a field that picks from the record's phone or email list
 * must hold one of that list's values. When `previous` is supplied (edit mode), untouched mandatory fields
 * that were already empty on the record don't block saving changes to other fields.
 */
export function validateValues(fields: FieldDef[], values: Values, context: RecordContext = {}, previous?: Values): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of fields) {
    if (isComputed(f) || !isVisible(f, values, context)) continue
    const val = values[f.apiName]
    const wasEmptyAndUntouched = previous !== undefined && isEmptyValue(previous[f.apiName]) && isEmptyValue(val)
    const condRequired = !!(f.displayRules?.requiredWhen?.length && isRequiredNow({ mandatory: false, displayRules: f.displayRules }, values, context))
    const mandatory = condRequired || (isRequiredNow(f, values, context) && !wasEmptyAndUntouched)
    const e = validateValue({ ...f, mandatory }, val)
    if (e) {
      errors[f.apiName] = e
      continue
    }
    if (f.optionsFrom && !isEmptyValue(val)) {
      const phone = f.dataType === 'PHONE'
      const own = listItems(values[f.optionsFrom]).map((i) => i.value)
      const v = String(val)
      if (!own.some((o) => (phone ? o.replace(/\D/g, '') === v.replace(/\D/g, '') : o.toLowerCase() === v.toLowerCase()))) {
        errors[f.apiName] = `Choose one of this record's ${phone ? 'phone numbers' : 'email addresses'}.`
      }
    }
  }
  return errors
}

/** Turns form values into what the API stores: numbers as numbers, blanks as null, empty list rows dropped. */
export function toApiValue(dataType: DataType, v: unknown): unknown {
  if (dataType === 'PHONE_LIST' || dataType === 'EMAIL_LIST') {
    const items = listItems(v).filter((i) => !isEmptyValue(i.value)).map((i) => ({ ...i, value: i.value.trim() }))
    return items.length ? items : null
  }
  if (isEmptyValue(v)) return null
  if (isNumeric(dataType)) return Number(String(v).replace(/,/g, ''))
  if (dataType === 'CHECKBOX') return v === true ? true : null
  if (dataType === 'BOOLEAN') return v === true || v === 'true'
  return typeof v === 'string' ? v.trim() : v
}

/** Turns a stored value into what an input shows. */
export function toFormValue(dataType: DataType, v: unknown): unknown {
  if (v === undefined || v === null) return dataType === 'MULTI_PICKLIST' || dataType === 'PHONE_LIST' || dataType === 'EMAIL_LIST' ? [] : ''
  if (isNumeric(dataType)) return String(v)
  return v
}
