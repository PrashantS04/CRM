import { NO_VALUE_OPERATORS, RELATIVE_DATES, type Condition } from './types'

/**
 * Checks filter logic such as "1 AND (2 OR NOT 3)" as you type, with the same rules the server applies
 * (Salesforce's): filter numbers, AND, OR, NOT and parentheses only; no mixing AND and OR at one level without
 * parentheses; every filter used. Returns an error message, or null when the logic is fine (or blank).
 */
export function checkLogic(logic: string, count: number): string | null {
  const text = logic.trim()
  if (!text) return null
  if (count === 0) return 'Add filters before writing filter logic.'
  const tokens = text.toUpperCase().match(/\d+|[A-Z]+|\(|\)|\S/g) ?? []
  const bad = tokens.find((t) => !/^\d+$/.test(t) && !['AND', 'OR', 'NOT', '(', ')'].includes(t))
  if (bad) return `'${bad}' isn't allowed. Use filter numbers, AND, OR, NOT and parentheses.`
  let pos = 0
  const used = new Set<number>()
  const expression = (): void => {
    factor()
    let op: string | null = null
    while (pos < tokens.length && (tokens[pos] === 'AND' || tokens[pos] === 'OR')) {
      const next = tokens[pos++]
      if (op && op !== next) throw new Error('Use parentheses when you mix AND and OR, e.g. 1 AND (2 OR 3).')
      op = next
      factor()
    }
  }
  const factor = (): void => {
    if (pos >= tokens.length) throw new Error('The filter logic ends too early. Add a filter number after AND, OR or NOT.')
    const t = tokens[pos++]
    if (t === 'NOT') return factor()
    if (t === '(') {
      expression()
      if (tokens[pos] !== ')') throw new Error("A '(' in the filter logic has no matching ')'.")
      pos++
      return
    }
    if (/^\d+$/.test(t)) {
      const n = Number(t)
      if (n < 1 || n > count) throw new Error(`There is no filter ${t}. Filters are numbered 1 to ${count}.`)
      used.add(n)
      return
    }
    throw new Error(`Unexpected '${t}' in the filter logic.`)
  }
  try {
    expression()
    if (pos < tokens.length) return `Unexpected '${tokens[pos]}' in the filter logic.`
    for (let i = 1; i <= count; i++) {
      if (!used.has(i)) return `Filter ${i} isn't used in the filter logic. Use every filter, or remove the ones you don't need.`
    }
    return null
  } catch (e) {
    return (e as Error).message
  }
}

/** True when a filter has everything it needs to be sent. */
export function conditionReady(c: Condition): boolean {
  if (NO_VALUE_OPERATORS.includes(c.operator)) return true
  if (c.operator === 'BETWEEN') return Array.isArray(c.value) && c.value.length === 2 && c.value.every((v) => String(v ?? '').trim() !== '')
  if (Array.isArray(c.value)) return c.value.length > 0
  return String(c.value ?? '').trim() !== ''
}

/** "LAST_N_DAYS:30" → "Last 30 days"; "THIS_MONTH" → "This month"; a fixed date stays as it is. */
export function relativeDateLabel(v: string): string | null {
  const n = /^(LAST|NEXT)_N_DAYS:(\d+)$/.exec(v)
  if (n) return `${n[1] === 'LAST' ? 'Last' : 'Next'} ${n[2]} days`
  return RELATIVE_DATES.find((r) => r.value === v)?.label ?? null
}
