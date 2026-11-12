import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetDatabase } from '@/mocks/db'
import { renderApp } from '@/test/renderApp'

beforeEach(() => resetDatabase())

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

describe('People', () => {
  it('lists people with their linked Entity and filters by search', async () => {
    const user = userEvent.setup()
    renderApp('/people')
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
    renderApp('/people/p1')
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
    renderApp('/people/p1')
    await screen.findByRole('heading', { name: 'James Caldwell' })
    await user.click(await screen.findByRole('button', { name: /add note/i }))
    await user.type(await screen.findByRole('textbox', { name: 'Note' }), 'Spoke about the IC pack')
    await user.click(screen.getByRole('button', { name: 'Add note' }))
    expect(await screen.findByText(/Spoke about the IC pack/)).toBeInTheDocument()
  })
})

describe('Entities (hard gates G1/G2)', () => {
  it('explains the gate and lists Entities with ACN/ABN', async () => {
    renderApp('/entities')
    expect(await screen.findByRole('link', { name: 'Mitchell Family Office' })).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent('Hard gate G1')
  })

  it('names the field when the ACN format is invalid (G2)', async () => {
    const user = userEvent.setup()
    renderApp('/entities')
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
    renderApp('/entities')
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

  it('switches field map blocks', async () => {
    const user = userEvent.setup()
    renderApp('/settings/forms')
    await user.click(await screen.findByRole('button', { name: /Panel membership/ }))
    expect(await screen.findByText('Panel Start Date')).toBeInTheDocument()
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
