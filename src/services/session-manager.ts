import { fetchAuthSession } from '@aws-amplify/auth'
import type { AuthSession } from '@aws-amplify/auth'

const ACCESS_TOKEN_KEY = 'access-token'
const ID_TOKEN_KEY = 'id-token'

const getStoredToken = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export const setAccessToken = (token: string | null | undefined) => {
  if (!token) {
    clearAccessToken()
    return
  }
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  } catch {
    // ignore
  }
}

export const setIdToken = (token: string | null | undefined) => {
  if (!token) {
    clearIdToken()
    return
  }
  try {
    localStorage.setItem(ID_TOKEN_KEY, token)
  } catch {
    // ignore
  }
}

export const getAccessToken = () => getStoredToken(ACCESS_TOKEN_KEY)
export const getIdToken = () => getStoredToken(ID_TOKEN_KEY)

export function clearAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch {
    // ignore
  }
}

export function clearIdToken() {
  try {
    localStorage.removeItem(ID_TOKEN_KEY)
  } catch {
    // ignore
  }
}

export const clearSessionTokens = () => {
  clearAccessToken()
  clearIdToken()
}

const decodeExp = (token: string): number | null => {
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    ) as { exp?: unknown }
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

// A token with no parseable/absent exp claim is treated as expired (fail closed).
export const isTokenExpired = (token: string | null | undefined): boolean => {
  if (!token) return true
  const exp = decodeExp(token)
  if (exp == null) return true
  return exp <= Math.floor(Date.now() / 1000)
}

type TokenLike = { toString(): string } | string | null | undefined

const tokenToString = (token: TokenLike): string | null => {
  if (!token) return null
  return typeof token === 'string' ? token : token.toString()
}

export const getFreshTokens = async ({
  forceRefresh = false,
}: { forceRefresh?: boolean } = {}): Promise<AuthSession['tokens'] | null> => {
  const session = await fetchAuthSession(
    forceRefresh ? { forceRefresh: true } : undefined,
  ).catch(() => null)
  const tokens = session?.tokens ?? null

  const accessToken = tokenToString(tokens?.accessToken)
  const idToken = tokenToString(tokens?.idToken)

  if (accessToken) setAccessToken(accessToken)
  if (idToken) setIdToken(idToken)

  return tokens
}

export const getFreshAccessToken = async (
  options: { forceRefresh?: boolean } = {},
): Promise<string | null> => {
  const tokens = await getFreshTokens(options)
  return tokenToString(tokens?.accessToken)
}

export const getFreshIdToken = async (
  options: { forceRefresh?: boolean } = {},
): Promise<string | null> => {
  const tokens = await getFreshTokens(options)
  return tokenToString(tokens?.idToken)
}
