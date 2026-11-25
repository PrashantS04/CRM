import * as matchers from '@testing-library/jest-dom/matchers'
import { vi } from 'vitest'
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

// Cognito env vars so `sso/config` can Amplify.configure() under jsdom.
vi.stubEnv('VITE_COGNITO_USER_POOL_ID', 'test-pool')
vi.stubEnv('VITE_COGNITO_APP_CLIENT_ID', 'test-client')
vi.stubEnv('VITE_COGNITO_DOMAIN', 'test.auth.region.amazoncognito.com')
vi.stubEnv('VITE_COGNITO_REDIRECT_SIGN_IN', 'http://localhost:5173/home')
vi.stubEnv('VITE_COGNITO_REDIRECT_SIGN_OUT', 'http://localhost:5173/')
vi.stubEnv('VITE_AZURE_TENANT_ID', '')
vi.stubEnv('VITE_AZURE_IDP_NAME', 'Azure-AD-LogIn')

// Tests run as an already-signed-in user: the Cognito session always exists.
const toBase64Url = (value: object) =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const fakeJwtPayload = {
  sub: 'test-subject',
  'cognito:username': 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  exp: 4102444800,
}
const fakeJwt = `${toBase64Url({ alg: 'none', typ: 'JWT' })}.${toBase64Url(fakeJwtPayload)}.fakesig`

const fakeAccessToken = {
  toString: () => fakeJwt,
  payload: {
    username: 'testuser',
    'cognito:groups': [],
    exp: 4102444800,
  },
}
const fakeIdToken = {
  toString: () => fakeJwt,
  payload: fakeJwtPayload,
}

vi.mock('@aws-amplify/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aws-amplify/auth')>()
  return {
    ...actual,
    fetchAuthSession: vi.fn(async () => ({
      tokens: { accessToken: fakeAccessToken, idToken: fakeIdToken },
    })),
  }
})

applyCssVariables()
