import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetDatabase } from '@/mocks/db'
import { calls, installCrmFake } from '@/test/crmFake'
import { renderApp } from '@/test/renderApp'

beforeEach(() => {
  // Mock-data modules (dashboard, opportunities, tasks, prototypes) and the live records API fake.
  resetDatabase()
  installCrmFake()
})

describe('navigation shell', () => {
  it('redirects / to the dashboard and shows the primary navigation', async () => {
    const router = renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Dashboards' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/dashboard')
    const nav = screen.getAllByRole('navigation', { name: 'Primary' })[0]!
    for (const label of ['Dashboard', 'People', 'Entities', 'Tasks', 'Reports', 'Settings']) {
      expect(within(nav).getByText(label)).toBeInTheDocument()
    }
  })

  it('shows a not-found page for unknown routes', async () => {
    renderApp('/nope')
    expect(await screen.findByText('Page not found')).toBeInTheDocument()
  })
})

describe('People (mock prototype)', () => {
  it('lists people with their linked Entity and filters by search', async () => {
    const user = userEvent.setup()
    renderApp('/prototype/people')
    expect(await screen.findByRole('link', { name: 'James Caldwell' })).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: 'Harbourview Group Limited' }).length,
    ).toBeGreaterThan(0)

    await user.type(screen.getByRole('searchbox', { name: 'Search people' }), 'olivia')
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'James Caldwell' })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('link', { name: 'Olivia Bennett' })).toBeInTheDocument()
  })

  it('opens a person and offers Call, Email and Task actions (C2, C3, C10)', async () => {
    renderApp('/prototype/people/p1')
    expect(await screen.findByRole('heading', { name: 'James Caldwell' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /call/i })).toHaveAttribute(
      'href',
      expect.stringMatching(/^(msteams|tel):/),
    )
    expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute(
      'href',
      'mailto:james.caldwell@harbourview.com.au',
    )
    expect(screen.getByRole('button', { name: 'Task' })).toBeInTheDocument()
  })

  it('adds a note that appears in the activity history (C1)', async () => {
    const user = userEvent.setup()
    renderApp('/prototype/people/p1')
    await screen.findByRole('heading', { name: 'James Caldwell' })
    await user.click(await screen.findByRole('button', { name: /add note/i }))
    await user.type(await screen.findByRole('textbox', { name: 'Note' }), 'Spoke about the IC pack')
    await user.click(screen.getByRole('button', { name: 'Add note' }))
    expect(await screen.findByText(/Spoke about the IC pack/)).toBeInTheDocument()
  })
})

describe('Entities (mock prototype, hard gates G1/G2)', () => {
  it('explains the gate and lists Entities with ACN/ABN', async () => {
    renderApp('/prototype/entities')
    expect(await screen.findByRole('link', { name: 'Mitchell Family Office' })).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent('Hard gate G1')
  })

  it('names the field when the ACN format is invalid (G2)', async () => {
    const user = userEvent.setup()
    renderApp('/prototype/entities')
    await screen.findByRole('link', { name: 'Mitchell Family Office' })
    await user.click(screen.getByRole('button', { name: /new entity/i }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Entity name'), 'Test Pty Ltd')
    await user.type(within(dialog).getByLabelText('ACN'), '123')
    await user.click(within(dialog).getByRole('button', { name: 'Save entity' }))
    expect(await within(dialog).findByText(/ACN is not in a valid format/)).toBeInTheDocument()
  })

  it('blocks a duplicate ACN on save (G1)', async () => {
    const user = userEvent.setup()
    renderApp('/prototype/entities')
    await screen.findByRole('link', { name: 'Mitchell Family Office' })
    await user.click(screen.getByRole('button', { name: /new entity/i }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Entity name'), 'Clone Pty Ltd')
    // ACN 000 000 019 is valid; seed an Entity holding it first via the API-level duplicate path.
    const { entitiesApi } = await import('@/api/entities')
    await entitiesApi.create({
      name: 'Existing',
      type: 'Developer',
      acn: '000000019',
      abn: '',
      owner: 'Alex Stewart',
    })
    await user.type(within(dialog).getByLabelText('ACN'), '000 000 019')
    await user.click(within(dialog).getByRole('button', { name: 'Save entity' }))
    expect(
      await within(dialog).findByText('An Entity with this ACN already exists.'),
    ).toBeInTheDocument()
  })
})

describe('People (live API)', () => {
  it('lists people from the API and filters by search', async () => {
    const user = userEvent.setup()
    renderApp('/people')
    expect(await screen.findByRole('link', { name: 'James Caldwell' })).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Borrower')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Search people' }), 'olivia')
    await waitFor(() => expect(screen.queryByRole('link', { name: 'James Caldwell' })).not.toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Olivia Bennett' })).toBeInTheDocument()
  })

  it('filters people in the filter panel, shows the filter as a chip and removes it', async () => {
    const user = userEvent.setup()
    const router = renderApp('/people')
    await screen.findByRole('link', { name: 'James Caldwell' })
    await user.click(screen.getByRole('button', { name: 'Filters' }))
    const panel = await screen.findByRole('dialog', { name: 'Filters' })
    await user.click(within(panel).getByRole('button', { name: 'Add filter' }))
    // The first filterable field is Type of contact (a multi-select): pick Adviser.
    await user.click(within(panel).getByRole('button', { name: 'Adviser' }))
    await user.click(within(panel).getByRole('button', { name: 'Apply filters' }))

    await waitFor(() => expect(screen.queryByRole('link', { name: 'James Caldwell' })).not.toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Olivia Bennett' })).toBeInTheDocument()
    const chips = screen.getByRole('group', { name: 'Applied filters' })
    expect(within(chips).getByText('Type of contact includes Adviser')).toBeInTheDocument()
    expect(router.state.location.search).toContain('filters=')
    expect(screen.getByRole('button', { name: 'Filters (1 applied)' })).toBeInTheDocument()

    await user.click(within(chips).getByRole('button', { name: 'Remove filter Type of contact includes Adviser' }))
    expect(await screen.findByRole('link', { name: 'James Caldwell' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Applied filters' })).not.toBeInTheDocument()
  })

  it('asks for a value before applying an incomplete filter', async () => {
    const user = userEvent.setup()
    renderApp('/entities')
    await screen.findByRole('link', { name: 'Mitchell Family Office' })
    await user.click(screen.getByRole('button', { name: 'Filters' }))
    const panel = await screen.findByRole('dialog', { name: 'Filters' })
    await user.click(within(panel).getByRole('button', { name: 'Add filter' }))
    await user.click(within(panel).getByRole('button', { name: 'Apply filters' }))
    expect(within(panel).getByText('Filter 1 needs a value.')).toBeInTheDocument()
  })

  it('opens a person with Call and Email actions from the primary phone and email (C2, C3)', async () => {
    renderApp('/people/p1')
    expect(await screen.findByRole('heading', { name: 'James Caldwell' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /call/i })).toHaveAttribute('href', 'tel:0412830412')
    expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute('href', 'mailto:james.caldwell@harbourview.com.au')
  })

  it('shows the linked Entity and the type the Person inherits through it', async () => {
    renderApp('/people/p1')
    await screen.findByRole('heading', { name: 'James Caldwell' })
    expect(screen.getAllByRole('link', { name: 'Harbourview Group Limited' }).length).toBeGreaterThan(0)
    expect(screen.getByText('via Developer')).toBeInTheDocument()
  })
})

describe('Records: opening, one-off fields and removed fields', () => {
  it('opens a person from the list at /people/:id', async () => {
    const user = userEvent.setup()
    const router = renderApp('/people')
    await user.click(await screen.findByRole('link', { name: 'Olivia Bennett' }))
    expect(await screen.findByRole('heading', { name: 'Olivia Bennett' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/people/p2')
  })

  it('redirects an old /persons link to /people', async () => {
    const router = renderApp('/persons/p1')
    expect(await screen.findByRole('heading', { name: 'James Caldwell' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/people/p1')
  })

  it('saves a field for this person only from the New person popup and shows it on the record', async () => {
    const user = userEvent.setup()
    const router = renderApp('/people')
    await screen.findByRole('link', { name: 'James Caldwell' })
    await user.click(screen.getByRole('button', { name: /new person/i }))
    const dialog = await screen.findByRole('dialog')
    await user.type(await within(dialog).findByLabelText(/^First Name/), 'Ava')
    await user.type(within(dialog).getByLabelText(/^Last Name/), 'Stone')
    await user.click(within(dialog).getByRole('button', { name: 'Adviser' }))
    await user.type(within(dialog).getAllByRole('textbox', { name: /email/i })[0]!, 'ava@stone.test')

    await user.click(within(dialog).getByRole('button', { name: 'Add a field for this person only' }))
    await user.click(within(dialog).getByRole('button', { name: 'Save person' }))
    expect(await within(dialog).findByText('Enter a label.')).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText(/^Field label/), 'Assistant name')
    await user.type(within(dialog).getByRole('textbox', { name: /^Assistant name/ }), 'Kim')
    await user.click(within(dialog).getByRole('button', { name: 'Save person' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/people/p3'))
    const card = await screen.findByRole('region', { name: 'Fields for this person only' })
    expect(within(card).getByText('Assistant name')).toBeInTheDocument()
    expect(within(card).getByText('Kim')).toBeInTheDocument()
    expect(calls).toContainEqual(expect.objectContaining({ method: 'POST', path: '/api/persons',
      body: expect.objectContaining({ recordFields: [{ label: 'Assistant name', dataType: 'TEXT', value: 'Kim' }] }) }))
  })

  it('adds a field for every Entity from the New entity popup', async () => {
    const user = userEvent.setup()
    renderApp('/entities')
    await screen.findByRole('link', { name: 'Mitchell Family Office' })
    await user.click(screen.getByRole('button', { name: /new entity/i }))
    const dialog = await screen.findByRole('dialog', { name: 'New entity' })
    await user.click(await within(dialog).findByRole('button', { name: 'Add a field for every Entity' }))
    const editor = await screen.findByRole('dialog', { name: 'Add a field for every Entity' })
    expect(within(editor).getByText(/^Field label|^Label/)).toBeInTheDocument()
  })

  it('adds, then removes, a field for this person only on the record page', async () => {
    const user = userEvent.setup()
    renderApp('/people/p2')
    const card = await screen.findByRole('region', { name: 'Fields for this person only' })
    await user.click(within(card).getByRole('button', { name: 'Add field' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add a field for this person only' })
    await user.type(within(dialog).getByLabelText(/^Field label/), 'Preferred café')
    await user.type(within(dialog).getByRole('textbox', { name: /^Value/ }), 'Bean There')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(await within(card).findByText('Bean There')).toBeInTheDocument()

    await user.click(within(card).getByRole('button', { name: 'Remove Preferred café' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(within(card).queryByText('Bean There')).not.toBeInTheDocument())
  })

  it('removes a shared field from one person and adds it back', async () => {
    const user = userEvent.setup()
    renderApp('/people/p1')
    await screen.findByRole('heading', { name: 'James Caldwell' })
    await user.click(screen.getByRole('button', { name: 'Remove Phones from this record' }))
    const dialog = await screen.findByRole('dialog', { name: 'Remove "Phones" from this person?' })
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }))
    const removed = await screen.findByRole('region', { name: 'Removed from this person' })
    expect(within(removed).getByText('Phones')).toBeInTheDocument()
    await user.click(within(removed).getByRole('button', { name: 'Add Phones back' }))
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Removed from this person' })).not.toBeInTheDocument())
  })
})

describe('Entities (hard gates G1/G2)', () => {
  it('lists Entities with ACN and ABN', async () => {
    renderApp('/entities')
    expect(await screen.findByRole('link', { name: 'Mitchell Family Office' })).toBeInTheDocument()
    expect(screen.getByText('000000019')).toBeInTheDocument()
  })

  it('names the field when the ACN format is invalid (G2)', async () => {
    const user = userEvent.setup()
    renderApp('/entities')
    await screen.findByRole('link', { name: 'Mitchell Family Office' })
    await user.click(screen.getByRole('button', { name: /new entity/i }))
    const dialog = await screen.findByRole('dialog')
    await user.type(await within(dialog).findByLabelText(/^Entity name/), 'Test Pty Ltd')
    await user.type(within(dialog).getByLabelText(/^ACN/), '123')
    await user.click(within(dialog).getByRole('button', { name: 'Save entity' }))
    expect(await within(dialog).findByText('An ACN has 9 digits. This one has 3.')).toBeInTheDocument()
  })

  it('blocks a duplicate ACN on save and points to the Entity that has it (G1)', async () => {
    const user = userEvent.setup()
    renderApp('/entities')
    await screen.findByRole('link', { name: 'Mitchell Family Office' })
    await user.click(screen.getByRole('button', { name: /new entity/i }))
    const dialog = await screen.findByRole('dialog')
    await user.type(await within(dialog).findByLabelText(/^Entity name/), 'Clone Pty Ltd')
    await user.type(within(dialog).getByLabelText(/^ACN/), '000 000 019')
    await user.selectOptions(within(dialog).getByLabelText(/^Entity type/), 'DEVELOPER')
    await user.click(within(dialog).getByRole('button', { name: 'Save entity' }))
    expect(await within(dialog).findByText(/This ACN is already used/)).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: 'Mitchell Family Office' })).toBeInTheDocument()
  })
})

describe('Setup', () => {
  it('renders Field map configuration on /settings/forms', async () => {
    renderApp('/settings/forms')
    expect(await screen.findByText('Field map configuration')).toBeInTheDocument()
    expect(screen.getByText('Mapped CRM blocks')).toBeInTheDocument()
    expect(screen.getByText('Person sections and fields')).toBeInTheDocument()
  })

  it('shows every Setup tab on /settings/setup', async () => {
    const router = renderApp('/settings/setup')
    const tabs = await screen.findByRole('tablist', { name: 'Setup' })
    expect(router.state.location.pathname).toBe('/settings/setup')
    for (const label of ['Person fields', 'Person rules', 'Entity fields', 'Entity rules', 'Picklists', 'Objects and fields', 'Business settings', 'Audit log']) {
      expect(within(tabs).getByRole('tab', { name: new RegExp(`^${label}`) })).toBeInTheDocument()
    }
    expect(await screen.findByText('First Name')).toBeInTheDocument()
  })

  it('shows Entity fields and keeps the tab in the URL', async () => {
    const user = userEvent.setup()
    const router = renderApp('/settings/setup')
    await user.click(await screen.findByRole('tab', { name: /^Entity fields/ }))
    expect(await screen.findByText('Entity name')).toBeInTheDocument()
    expect(screen.getByText('ACN check')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?tab=entity-fields')
  })

  it('shows each section as a card, with a pill overview, and adds a section', async () => {
    const user = userEvent.setup()
    renderApp('/settings/setup')
    const pills = await screen.findByRole('group', { name: 'Sections' })
    for (const name of ['Classification', 'Personal details', 'Sales tracking']) {
      expect(within(pills).getByRole('button', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('heading', { name: 'Personal details', level: 3 })).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by section' }), 'Classification')
    expect(screen.queryByText('First Name')).not.toBeInTheDocument()
    expect(screen.getByText('Type of contact')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'New section' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/^Section name/), 'Compliance')
    await user.click(within(dialog).getByRole('button', { name: 'Create section' }))
    expect(await within(screen.getByRole('group', { name: 'Sections' })).findByRole('button', { name: 'Compliance' })).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by section' }), '')
    expect(await screen.findByText('No fields in “Compliance” yet')).toBeInTheDocument()
  })

  it('collapses every section and expands them again', async () => {
    const user = userEvent.setup()
    renderApp('/settings/setup')
    const toggle = await screen.findByRole('button', { name: /^Personal details/, expanded: true })
    await user.click(screen.getByRole('button', { name: 'Collapse all' }))
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(screen.getByRole('button', { name: 'Expand all' }))
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('relabels a picklist value and adds a new one', async () => {
    const user = userEvent.setup()
    renderApp('/settings/setup?tab=picklists')
    const label = await screen.findByRole('textbox', { name: 'Label for ADVISER' })
    await user.clear(label)
    await user.type(label, 'Financial adviser{Enter}')
    await waitFor(() => expect(calls).toContainEqual(expect.objectContaining({
      method: 'PUT', path: '/api/metadata/picklists/PERSON_TYPE/values/ADVISER', body: { label: 'Financial adviser' } })))
    await user.type(screen.getByLabelText('New value'), 'Accountant')
    await user.click(screen.getByRole('button', { name: 'Add value' }))
    expect(await screen.findByRole('textbox', { name: 'Label for ACCOUNTANT' })).toHaveValue('Accountant')
  })

  it('renames a record type and the list page uses the new label', async () => {
    const user = userEvent.setup()
    renderApp('/settings/setup?tab=objects')
    const plural = await screen.findByLabelText('Plural', { selector: '#op-entity' })
    await user.clear(plural)
    await user.type(plural, 'Organisations')
    await user.clear(screen.getByLabelText('Singular', { selector: '#ol-entity' }))
    await user.type(screen.getByLabelText('Singular', { selector: '#ol-entity' }), 'Organisation')
    await user.click(within(screen.getByRole('form', { name: 'entity labels' })).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(calls).toContainEqual(expect.objectContaining({
      method: 'PUT', path: '/api/metadata/objects/entity', body: { label: 'Organisation', labelPlural: 'Organisations' } })))
  })

  it('validates and saves business settings', async () => {
    const user = userEvent.setup()
    renderApp('/settings/setup?tab=settings')
    const hot = await screen.findByLabelText(/Hot flag clears after/)
    await user.clear(hot)
    await user.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(await screen.findByText('Enter a whole number from 1 to 365.')).toBeInTheDocument()
    await user.type(hot, '45')
    await user.selectOptions(screen.getByLabelText('Duplicate review queue'), 'u2')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))
    await waitFor(() => expect(calls).toContainEqual(expect.objectContaining({
      method: 'PUT', path: '/api/metadata/settings', body: { hotExpiryDays: 45, duplicateQueueOwner: 'u2' } })))
  })

  it('lists audit entries and filters them by area', async () => {
    const user = userEvent.setup()
    renderApp('/settings/setup?tab=audit')
    const entries = await screen.findByRole('list', { name: 'Audit entries' })
    expect(within(entries).getByRole('link', { name: 'James Caldwell' })).toHaveAttribute('href', '/people/p1')
    expect(within(entries).getByText('Sophie Turner')).toBeInTheDocument()
    expect(within(entries).getByText('Daniel Ng')).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by area' }), 'picklist_value')
    await waitFor(() => expect(screen.queryByRole('link', { name: 'James Caldwell' })).not.toBeInTheDocument())
    expect(within(screen.getByRole('list', { name: 'Audit entries' })).getByText('Daniel Ng')).toBeInTheDocument()
  })
})

describe('Opportunities', () => {
  it('shows every Loan stage as a kanban column (brief §4.1)', async () => {
    renderApp('/loan-opportunities')
    expect(
      await screen.findByRole('group', { name: 'Loan Opportunities board' }),
    ).toBeInTheDocument()
    for (const stage of [
      'Enquiry',
      'Initial Assessment',
      'ITS',
      'Acceptance',
      'Credit DD',
      'IRC Approval',
      'Docs & Legal',
      'Booking',
      'Closed/Won',
    ]) {
      expect(
        await screen.findByRole('region', {
          name: new RegExp(`^${stage.replace(/[/&]/g, '.')}, \\d+ items`),
        }),
      ).toBeInTheDocument()
    }
  })

  it('shows every Investment stage (brief §5.4)', async () => {
    renderApp('/investment-opportunities')
    for (const stage of [
      'First Contact',
      'In Discussion',
      'Amount Indicated',
      'Investor DD',
      'Subscription Signed',
      'Funded',
      'Invested',
    ]) {
      expect(
        await screen.findByRole('region', { name: new RegExp(`^${stage}, \\d+ items`) }),
      ).toBeInTheDocument()
    }
  })

  it('opens an opportunity with the stage flow and moves its stage', async () => {
    const user = userEvent.setup()
    renderApp('/loan-opportunities/o1')
    expect(
      await screen.findByRole('heading', { name: 'Harbour View Mixed Use' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Current stage')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Move stage' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Booking' }))
    await user.click(within(dialog).getByRole('button', { name: 'Move stage' }))
    expect(await screen.findByText(/Loan Opportunity · Booking/)).toBeInTheDocument()
  })
})

describe('Tasks', () => {
  it('lists tasks and derives Overdue from the due date', async () => {
    renderApp('/tasks')
    expect(
      await screen.findByRole('link', { name: 'Follow up with borrower re updated financials' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })

  it('marks a task done from its detail page', async () => {
    const user = userEvent.setup()
    renderApp('/tasks/t2')
    await screen.findByRole('heading', { name: 'Prepare credit memo for committee' })
    await user.click(screen.getByRole('button', { name: 'Mark done' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mark done' })).toBeDisabled())
  })
})

describe('Dashboards and settings', () => {
  it('renders the Loan dashboard KPIs', async () => {
    renderApp('/dashboard/loan')
    expect(await screen.findByText('$498m')).toBeInTheDocument()
    expect(screen.getByText('Follow-ups overdue')).toBeInTheDocument()
  })

  it('renders the validation rules and the hard gate register', async () => {
    renderApp('/settings/validations')
    expect(await screen.findByText('Hard gate register')).toBeInTheDocument()
    expect(screen.getByText(/G6 legal name before Booking or Closed Won/)).toBeInTheDocument()
  })

  it('reorders stages on the pipeline configuration page', async () => {
    const user = userEvent.setup()
    renderApp('/settings/pipelines')
    await user.click(await screen.findByRole('button', { name: 'Move Enquiry down' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Move Enquiry up' })).toBeEnabled(),
    )
  })
})
