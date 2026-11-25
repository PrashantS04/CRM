import type { ObjectRules } from '../api'

/** Which rules use a field: shown next to it and before it is disabled or deleted. */
export function ruleUses(apiName: string, r: ObjectRules | null): string[] {
  if (!r) return []
  const uses: string[] = []
  if (r.nameFields.includes(apiName)) uses.push('Record name')
  const d = r.duplicateCheck
  if (d.nameFields.includes(apiName) || [d.emailField, d.mobileField, d.dateOfBirthField].includes(apiName)) uses.push('Duplicate check')
  if (r.uniqueFields?.includes(apiName)) uses.push('Unique (G1)')
  if (r.ownerField === apiName) uses.push('Owner')
  if (r.typeField === apiName) uses.push('Type')
  if (r.reviewQueue?.field === apiName) uses.push('Review queue')
  return uses
}

