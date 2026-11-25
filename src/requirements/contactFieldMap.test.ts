/**
 * The client field map (EXT_CRM_Field_Map_MASTERContact.csv) against the screen side of the CRM:
 *  1. the New Person / edit form rules (validateValues) on the Person configuration the backend seeds, row by row;
 *  2. the Setup → Field map page (FIELD_MAP_CATALOG), which shows the field map to users and must not contradict it.
 * The backend's ContactFieldMapConformanceTest checks the seeded definitions themselves against every row.
 */
import { validateValues } from '@/features/records/fields/validate'
import { FIELD_MAP_CATALOG } from '@/features/settings/fieldMapCatalog'
import { contactFields, validContact } from '@/test/fieldDefs'
import { loadFieldMap, need, rowValues, type FieldMapRow } from '@/test/fieldMapCsv'

const rows = loadFieldMap()
const contactRows = rows.filter((r) => r.object === 'Contact')
const fields = contactFields()
const byLabel = new Map(fields.map((f) => [f.label.toLowerCase(), f]))

/**
 * Where the build's Required rule differs from a row on purpose (same register as the backend test; needs client
 * sign-off). DEV-01 (Address line 2) now follows the map: migration 2026-11-23_008 makes it Required.
 */
const REQUIRED_DEVIATIONS: Record<string, string> = {}

describe('New Person form follows the field map', () => {
  it('a complete Person passes', () => {
    expect(validateValues(fields, validContact())).toEqual({})
  })

  const mandatoryRows = contactRows.filter(
    (r) => need(r.required, r.rule) === 'MANDATORY' && byLabel.has(r.field.toLowerCase()) && !REQUIRED_DEVIATIONS[r.field],
  )

  it('covers every mandatory Contact field of the map that the form has', () => {
    expect(mandatoryRows.map((r) => r.field)).toEqual(
      expect.arrayContaining(['Type of contact', 'First Name', 'Last Name', 'Address line 1', 'Address line 2', 'Suburb or city',
        'State or region', 'Postcode', 'Country', 'Phones', 'Email']),
    )
  })

  it.each(mandatoryRows.map((r) => [r.field, r] as const))('%s (Required) stops the save when empty', (_label, row) => {
    const f = byLabel.get(row.field.toLowerCase())!
    const values = { ...validContact(), [f.apiName]: f.dataType.endsWith('LIST') || f.dataType === 'MULTI_PICKLIST' ? [] : '' }
    expect(validateValues(fields, values)).toEqual({ [f.apiName]: `${f.label} is required.` })
  })

  it.each(contactRows.filter((r) => need(r.required, r.rule) === 'OPTIONAL' && byLabel.has(r.field.toLowerCase()))
    .map((r) => [r.field] as const))('%s (Optional) may stay empty', (label) => {
    const f = byLabel.get(label.toLowerCase())!
    expect(validateValues(fields, { ...validContact(), [f.apiName]: null })).toEqual({})
  })

  for (const [label, reason] of Object.entries(REQUIRED_DEVIATIONS)) {
    it(`${label}: documented deviation (${reason})`, () => {
      const row = contactRows.find((r) => r.field === label)!
      expect(need(row.required)).toBe('MANDATORY')
      // Still optional in the build; when this fails, the build matches the map: remove the register entry.
      expect(byLabel.get(label.toLowerCase())!.mandatory).toBe(false)
    })
  }

  it('ABN: Required (if Yes)', () => {
    expect(validateValues(fields, { ...validContact(), soleTrader: 'YES' })).toEqual({ abn: 'ABN is required.' })
    expect(validateValues(fields, { ...validContact(), soleTrader: 'YES', abn: '51 824 753' }))
      .toEqual({ abn: 'An ABN has 11 digits. This one has 8.' })
    expect(validateValues(fields, { ...validContact(), soleTrader: 'YES', abn: '51 824 753 556' })).toEqual({})
    expect(validateValues(fields, { ...validContact(), soleTrader: 'NO' })).toEqual({})
  })

  it.each([['SMS'], ['PHONE']])('Preferred phone: required when the preferred channel is %s, from the Person\'s phones', (channel) => {
    const v = { ...validContact(), preferredChannels: [channel] }
    expect(validateValues(fields, v)).toEqual({ preferredPhone: 'Preferred phone is required.' })
    expect(validateValues(fields, { ...v, preferredPhone: '0499 000 000' }))
      .toEqual({ preferredPhone: "Choose one of this record's phone numbers." })
    expect(validateValues(fields, { ...v, preferredPhone: '0412345678' })).toEqual({})
  })

  it('Preferred email: required when the preferred channel is Email, from the Person\'s emails', () => {
    const v = { ...validContact(), preferredChannels: ['EMAIL'] }
    expect(validateValues(fields, v)).toEqual({ preferredEmail: 'Preferred email is required.' })
    expect(validateValues(fields, { ...v, preferredEmail: 'AVA@example.test' })).toEqual({})
  })

  it.each([['OPTED_IN'], ['OPTED_OUT']])('Marketing channels: required when consent is %s (regardless of opted in or out)', (consent) => {
    expect(validateValues(fields, { ...validContact(), marketingConsent: consent }))
      .toEqual({ marketingChannels: 'Marketing channels is required.' })
  })

  it('Preferred marketing phone / email: required for the marketing channels chosen', () => {
    const v = { ...validContact(), marketingConsent: 'OPTED_IN' }
    expect(validateValues(fields, { ...v, marketingChannels: ['SMS', 'EMAIL'] })).toEqual({
      preferredMarketingPhone: 'Preferred marketing phone is required.',
      preferredMarketingEmail: 'Preferred marketing email is required.',
    })
    expect(validateValues(fields, { ...v, marketingChannels: ['EMAIL'], preferredMarketingEmail: 'nope' }))
      .toEqual({ preferredMarketingEmail: 'This email address is not in a valid format.' })
  })

  it('System rows (Last updated by, LinkedIn Connect Age) are never asked for', () => {
    const systemRows = contactRows.filter((r) => need(r.required) === 'SYSTEM' && byLabel.has(r.field.toLowerCase()))
    expect(systemRows.map((r) => r.field)).toEqual(['Last updated by', 'LinkedIn Connect Age (Weeks)'])
    for (const r of systemRows) {
      const f = byLabel.get(r.field.toLowerCase())!
      expect(validateValues([{ ...f, mandatory: true }], {})).toEqual({})
    }
  })

  it('Broker profile (Dependent): ACR, ACL and Industry Body hide unless a Broker links to an aggregator', () => {
    const acr = fields.filter((f) => f.section === 'Broker profile')
    const required = acr.map((f) => ({ ...f, mandatory: true }))
    expect(validateValues(required, { personTypes: ['BROKER'] }, { linkedEntityType: ['DEVELOPER'] })).toEqual({})
    expect(Object.keys(validateValues(required, { personTypes: ['BROKER'] }, { linkedEntityType: ['AGGREGATOR_GROUP'] })))
      .toEqual(['acr', 'acl', 'industryBody'])
  })
})

/* ---------------------------------------------------------------------------------------------------------------- */

/** Setup → Field map page block → field map CSV object. Blocks with no CSV rows (Entity, Loan Opportunity) are skipped. */
const BLOCK_OBJECTS: Record<string, string> = {
  Person: 'Contact',
  'Linked entities': 'Contact [Linked entities]',
  'Linked opportunities': 'Contact [Linked opportunities]',
  'Broker profile': 'Contact [Broker]',
  Documents: 'Contact',
  Note: 'Note',
  Activity: 'Activity',
}

/**
 * Where the Field map page says something the client's field map does not. Each is a test that is
 * expected to fail (`it.fails`): when the catalog is corrected the test passes, Vitest reports it, and the entry
 * comes out of this list.
 */
const CATALOG_GAPS: Record<string, string> = {
  // GAP-02 (fixed): Preferred investment offerings showed "QSR and Industrial" and left out "Managing Credit Books".
}

const find = (object: string, field: string): FieldMapRow | undefined =>
  rows.find((r) => r.object === object && r.field.toLowerCase() === field.toLowerCase())

const catalogEntries = Object.entries(BLOCK_OBJECTS).flatMap(([block, object]) =>
  (FIELD_MAP_CATALOG[block] ?? []).map((entry) => ({ block, object, entry })),
)

describe('Setup → Field map page matches the client field map', () => {
  it.each(catalogEntries.map((c) => [`${c.block} / ${c.entry.field}`, c] as const))('%s is a field of the map', (_name, c) => {
    expect(find(c.object, c.entry.field), `"${c.entry.field}" is not a ${c.object} row of the field map`).toBeDefined()
  })

  const comparable = catalogEntries.filter((c) => find(c.object, c.entry.field))

  it.each(comparable.map((c) => [`${c.block} / ${c.entry.field}`, c] as const))('%s: Required column agrees', (_name, c) => {
    const row = find(c.object, c.entry.field)!
    if (REQUIRED_DEVIATIONS[row.field] && c.block === 'Person') {
      expect(need(c.entry.required), 'catalog shows the build (deviation DEV-01)').toBe('OPTIONAL')
      return
    }
    expect(need(c.entry.required)).toBe(need(row.required, row.rule))
  })

  const withValues = comparable.filter((c) => rowValues(find(c.object, c.entry.field)!).length && c.entry.rule.includes(','))
  for (const c of withValues) {
    const name = `${c.block} / ${c.entry.field} values`
    // The page lists exactly the map's values: none mistyped or invented, none left out.
    const check = () => {
      const allowed = rowValues(find(c.object, c.entry.field)!).map((v) => v.toLowerCase())
      const shown = c.entry.rule.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean)
      expect(shown.filter((v) => !allowed.includes(v)), 'values the map does not have').toEqual([])
      expect(allowed.filter((v) => !shown.includes(v)), 'values of the map the page leaves out').toEqual([])
    }
    if (CATALOG_GAPS[name]) it.fails(`${name}: known gap (${CATALOG_GAPS[name]})`, check)
    else it(`${name} are exactly the map's values`, check)
  }

  // Rows of the map the page does not list yet: reported, not failed (the page is a summary).
  const listed = new Set(catalogEntries.map((c) => `${c.object}|${c.entry.field.toLowerCase()}`))
  const shownObjects = new Set(Object.values(BLOCK_OBJECTS))
  for (const r of rows.filter((x) => shownObjects.has(x.object) && !listed.has(`${x.object}|${x.field.toLowerCase()}`))) {
    it.todo(`Field map page does not list ${r.object} / ${r.field} (line ${r.line})`)
  }
})
