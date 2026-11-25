import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { CONTACT_PICKLISTS, contactFields, validContact } from '@/test/fieldDefs'
import type { RecordConfig } from '../hooks'
import { DynamicForm, groupBySection, isWide } from './DynamicForm'
import { FieldInput, probeField } from './FieldInput'
import type { FieldDef, Values } from './types'

const config = {
  picklists: CONTACT_PICKLISTS,
  users: [{ id: 'u1', name: 'Sophie Turner', email: 'sophie@example.test', initials: 'ST' }],
  optionLabel: (set: string | null | undefined, code: string) =>
    CONTACT_PICKLISTS[set ?? '']?.values.find((v) => v.code === code)?.label ?? code,
  userName: (id: string) => (id === 'u1' ? 'Sophie Turner' : id),
} as unknown as RecordConfig

/** A form with state, as NewRecordDialog uses it. */
function Harness({ fields, initial, context = {} }: { fields: FieldDef[]; initial: Values; context?: Record<string, unknown> }) {
  const [values, setValues] = useState<Values>(initial)
  return (
    <DynamicForm fields={fields} values={values} errors={{}} mode="create" context={context} config={config}
      onChange={(api, v) => setValues((cur) => ({ ...cur, [api]: v }))} />
  )
}

const sectionTitles = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)

describe('DynamicForm on the field map Person configuration', () => {
  it('groups fields into the field map blocks, in field order', () => {
    render(<Harness fields={contactFields()} initial={validContact()} />)
    expect(sectionTitles()).toEqual(['Classification', 'Personal details', 'Legal details', 'Contact profile',
      'Communication consent', 'Marketing', 'Marketing / LinkedIn', 'Marketing / Mailchimp'])
    // Broker profile shows only for a Broker linked to an aggregator.
    expect(screen.queryByText('ACR')).not.toBeInTheDocument()
  })

  it('marks the required fields with an asterisk', () => {
    render(<Harness fields={contactFields()} initial={validContact()} />)
    const label = screen.getByText('First Name').closest('label')!
    expect(within(label).getByText('*')).toBeInTheDocument()
    expect(within(screen.getByText('Preferred name').closest('label')!).queryByText('*')).not.toBeInTheDocument()
  })

  it('shows ABN, required, only once Sole trader is Yes', async () => {
    const user = userEvent.setup()
    render(<Harness fields={contactFields()} initial={validContact()} />)
    expect(screen.queryByLabelText(/^ABN/)).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Sole trader'), 'YES')
    const abn = screen.getByLabelText(/^ABN/)
    expect(abn).toBeInTheDocument()
    expect(within(abn.closest('div')!.parentElement!).getByText('*')).toBeInTheDocument()
    expect(abn).toHaveAttribute('maxLength', '14')
    await user.type(abn, '51824753556999')
    expect(abn).toHaveValue('51 824 753 556')
    await user.selectOptions(screen.getByLabelText('Sole trader'), 'NO')
    expect(screen.queryByLabelText(/^ABN/)).not.toBeInTheDocument()
  })

  it("Preferred phone appears for SMS and offers the Person's own phone numbers", async () => {
    const user = userEvent.setup()
    render(<Harness fields={contactFields()} initial={validContact()} />)
    expect(screen.queryByLabelText(/^Preferred phone/)).not.toBeInTheDocument()
    await user.click(within(screen.getByRole('group', { name: 'Preferred channel' })).getByRole('button', { name: 'SMS' }))
    const select = screen.getByLabelText(/^Preferred phone/)
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['— Choose —', '0412 345 678'])
  })

  it('Marketing channels appear once a marketing consent is chosen', async () => {
    const user = userEvent.setup()
    render(<Harness fields={contactFields()} initial={validContact()} />)
    expect(screen.queryByRole('group', { name: 'Marketing channels' })).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Marketing consent'), 'OPTED_OUT')
    expect(screen.getByRole('group', { name: 'Marketing channels' })).toBeInTheDocument()
  })

  it('shows CRM-set fields read-only', () => {
    render(<Harness fields={contactFields()} initial={{ ...validContact(), linkedinAgeWeeks: 3 }} />)
    const block = screen.getByText('LinkedIn Connect Age (Weeks)').parentElement!
    expect(within(block).getByText('Set by the CRM.')).toBeInTheDocument()
    expect(within(block).queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows the Broker profile for a Broker linked to an Aggregator', () => {
    render(<Harness fields={contactFields()} initial={{ ...validContact(), personTypes: ['BROKER'] }}
      context={{ linkedEntityType: ['AGGREGATOR_GROUP'] }} />)
    expect(sectionTitles()).toContain('Broker profile')
    expect(screen.getByLabelText('Industry Body')).toBeInTheDocument()
  })

  it('Phones: adding a row and starring it keeps exactly one primary', async () => {
    const user = userEvent.setup()
    render(<Harness fields={contactFields()} initial={validContact()} />)
    const phones = screen.getByRole('group', { name: 'Phones' })
    await user.click(within(phones).getByRole('button', { name: /Add phone/ }))
    await user.type(within(phones).getByLabelText('Phones 2'), '02 9000 0000')
    await user.click(within(phones).getByRole('button', { name: 'Make 02 9000 0000 primary' }))
    const stars = within(phones).getAllByRole('button', { pressed: true })
    expect(stars).toHaveLength(1)
    expect(stars[0]).toHaveAccessibleName('02 9000 0000 is primary')
  })

  it('formats ACN live, caps at 9 digits and sets helper placeholder', async () => {
    const user = userEvent.setup()
    function AcnHarness() {
      const [val, setVal] = useState('')
      return (
        <FieldInput
          field={probeField('TEXT', 'ACN', 'acn')}
          value={val}
          onChange={(v) => setVal(String(v))}
          picklists={{}}
          users={[]}
        />
      )
    }
    render(<AcnHarness />)
    const input = screen.getByLabelText(/^ACN/)
    expect(input).toHaveAttribute('maxLength', '11')
    expect(input).toHaveAttribute('placeholder', 'e.g. 000 000 019')
    await user.type(input, '00000001999999')
    expect(input).toHaveValue('000 000 019')
  })
})

describe('layout helpers', () => {
  it('groupBySection keeps first-seen order and puts unnamed fields under Details', () => {
    const [a, b, c] = contactFields()
    const grouped = groupBySection([{ ...a!, section: 'B' }, { ...b!, section: ' ' }, { ...c!, section: 'B' }])
    expect(grouped.map(([s, fs]) => [s, fs.length])).toEqual([['B', 2], ['Details', 1]])
  })

  it('lists, long text and multi-selects take the full width', () => {
    const byApi = Object.fromEntries(contactFields().map((f) => [f.apiName, f]))
    expect(isWide(byApi.phones!)).toBe(true)
    expect(isWide(byApi.background!)).toBe(true)
    expect(isWide(byApi.personTypes!)).toBe(true)
    expect(isWide(byApi.firstName!)).toBe(false)
  })
})
