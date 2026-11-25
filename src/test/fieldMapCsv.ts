/**
 * Reads the client field map (EXT_CRM_Field_Map_MASTERContact.csv, kept verbatim in src/test/fixtures) for
 * requirement tests. The backend reads the same file (BE src/test/resources/requirements); when the client
 * issues a new version, replace both copies.
 */
import fieldMapText from './fixtures/contact-field-map.csv?raw'

export interface FieldMapRow {
  line: number
  object: string
  field: string
  fieldType: string
  required: string
  picklistValues: string
  notes: string
  rule: string
  block: string
  businessUnit: string
}

/** No-break spaces become spaces, runs of spaces collapse, and the cell is trimmed. */
export const cleanCell = (s: string) =>
  s.replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim()

/** RFC 4180: quoted cells may hold commas, doubled quotes and line breaks. Skips the header and blank rows. */
export function parseFieldMap(text: string): FieldMapRow[] {
  const src = text.replace(/^﻿/, '')
  const rows: FieldMapRow[] = []
  let cells: string[] = []
  let cell = ''
  let quoted = false
  let line = 1
  let rowStart = 1
  let header = true
  const endRow = () => {
    cells.push(cell)
    cell = ''
    if (!header) {
      const c = (i: number) => cleanCell(cells[i] ?? '')
      if (c(0) || c(1)) {
        rows.push({ line: rowStart, object: c(0), field: c(1), fieldType: c(2), required: c(3), picklistValues: c(4),
          notes: c(5), rule: c(6), block: c(7), businessUnit: c(8) })
      }
    }
    header = false
    cells = []
  }
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        if (ch === '\n') line++
        cell += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      cells.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      endRow()
      line++
      rowStart = line
    } else {
      cell += ch
    }
  }
  if (cell || cells.length) endRow()
  return rows
}

export const loadFieldMap = () => parseFieldMap(fieldMapText)

/** A row's picklist values. The client separates with ';' when a value holds a comma, otherwise with ','. */
export function rowValues(r: Pick<FieldMapRow, 'picklistValues'>): string[] {
  if (!r.picklistValues) return []
  const sep = r.picklistValues.includes(';') ? ';' : ','
  return r.picklistValues.split(sep).map(cleanCell).filter(Boolean)
}

export type Need = 'MANDATORY' | 'OPTIONAL' | 'CONDITIONAL' | 'DEPENDENT' | 'SYSTEM'

/** What a Required cell asks for, read the same way as the backend's ContactFieldMapConformanceTest. */
export function need(required: string, rule = ''): Need {
  const q = required.toLowerCase()
  const r = rule.toLowerCase()
  if (q.includes('system')) return 'SYSTEM'
  if (q.startsWith('dependent')) return 'DEPENDENT'
  if (q.startsWith('required') && (/\bif\b/.test(q) || q.includes('opted') || r.includes('required if'))) return 'CONDITIONAL'
  if (q.startsWith('required')) return 'MANDATORY'
  if (q.startsWith('optional')) return 'OPTIONAL'
  throw new Error(`Unknown Required value '${required}'`)
}
