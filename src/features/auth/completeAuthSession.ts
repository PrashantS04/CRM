import { fetchAuthSession } from '@aws-amplify/auth'
import {
  AUTH_PROVIDER_STORAGE_KEY,
  detectAuthProviderFromSession,
} from '@/sso/config'
import { setAccessToken, setIdToken } from '@/services/session-manager'
import { setAuthenticated, type AuthUser } from './authStore'

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    ) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Stores the Cognito tokens from the active Amplify session and marks the
 * app as authenticated. CRM has no backend profile endpoint yet, so the
 * user identity comes straight from the id token claims.
 */
export const completeAuthenticatedSession = async () => {
  const session = await fetchAuthSession()

  if (!session?.tokens?.idToken) {
    throw new Error('No active Cognito session found')
  }

  const accessToken = session.tokens.accessToken.toString()
  const idToken = session.tokens.idToken.toString()

  setAccessToken(accessToken)
  setIdToken(idToken)

  const authProvider = detectAuthProviderFromSession(session)
  if (authProvider !== 'unknown') {
    localStorage.setItem(AUTH_PROVIDER_STORAGE_KEY, authProvider)
  }

  const payload = decodeJwtPayload(idToken) ?? {}
  const accessPayload =
    (session.tokens.accessToken.payload as Record<string, unknown> | undefined) ?? {}
  const rawGroups = accessPayload['cognito:groups']
  const groups = Array.isArray(rawGroups) ? rawGroups.map(String) : []
  const user: AuthUser = {
    username: String(payload['cognito:username'] ?? ''),
    email: String(payload.email ?? ''),
    name: String(payload.name ?? ''),
    role: groups[0] ?? '',
    groups,
  }
  setAuthenticated(user)

  return { ok: true as const, user }
}
