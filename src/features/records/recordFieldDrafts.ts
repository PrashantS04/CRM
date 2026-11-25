import type { DataType, DraftRecordField } from './fields/types'
import { toApiValue, validateValue } from './fields/validate'

/** A one-off value must be filled in: an empty one-off field has no reason to exist. */
export const valueError = (dataType: DataType, value: unknown) =>
  validateValue({ label: 'Value', dataType, mandatory: true, maxLength: null, decimalPlaces: null, validation: {} }, value)

/** Checks the one-off fields typed on a New form; errors are keyed `<draft key>.label` and `<draft key>.value`. */
export function validateDrafts(drafts: DraftRecordField[]): Record<string, string> {
  const errs: Record<string, string> = {}
  const seen = new Set<string>()
  for (const d of drafts) {
    const label = d.label.trim()
    if (!label) errs[`${d.key}.label`] = 'Enter a label.'
    else if (seen.has(label.toLowerCase())) errs[`${d.key}.label`] = 'Another field here has this label.'
    seen.add(label.toLowerCase())
    const e = valueError(d.dataType, d.value)
    if (e) errs[`${d.key}.value`] = e
  }
  return errs
}

/** The one-off fields as the create API takes them. */
export const draftsToApi = (drafts: DraftRecordField[]): DraftRecordField[] =>
  drafts.map((d) => ({ ...d, label: d.label.trim(), value: toApiValue(d.dataType, d.value) }))
