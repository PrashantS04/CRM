import { screen } from '@testing-library/react'
import { resetDatabase } from '@/mocks/db'
import { renderApp } from '@/test/renderApp'

beforeEach(() => resetDatabase())

it('renders the entity detail record layout', async () => {
  renderApp('/entities/e1')
  expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Details' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'History' })).toBeInTheDocument()
})
