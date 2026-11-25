import { screen } from '@testing-library/react'
import { resetDatabase } from '@/mocks/db'
import { renderApp } from '@/test/renderApp'

beforeEach(() => resetDatabase())

// The mock-data Entity pages (record e1 lives in the mock database) moved to /prototype/entities when the live
// /entities records page took over that route.
it('renders the entity detail record layout', async () => {
  renderApp('/prototype/entities/e1')
  expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Details' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'History' })).toBeInTheDocument()
})
