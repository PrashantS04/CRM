import * as matchers from '@testing-library/jest-dom/matchers'
import { applyCssVariables } from '@/theme/cssVars'

// Register jest-dom matchers on vitest's global `expect` (vitest `globals: true`).
expect.extend(matchers)

// Recharts and MUI measure the DOM; jsdom has no layout engine.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

applyCssVariables()
