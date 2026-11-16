import { fetchAuthSession } from '@aws-amplify/auth'
import {
  AUTH_PROVIDER_STORAGE_KEY,
  AZURE_TENANT_ID,
  COGNITO_APP_CLIENT_ID,
  COGNITO_DOMAIN,
  detectAuthProviderFromSession,
  doSignOut,
} from '@/sso/config'
import {
  clearSessionTokens,
  getFreshAccessToken,
} from './session-manager'
import { setTokenProvider, setUnauthorizedHandler } from '@/api/client'
import { setAnonymous } from '@/features/auth/authStore'

export const getCurrentUser = async () => {
  const session = await fetchAuthSession()
  const idToken = session.tokens?.idToken
  if (!idToken) return null

  const payload = idToken.payload as Record<string, unknown>
  return {
    email: payload.email as string | undefined,
    phone: payload.phone_number as string | undefined,
    name: payload.name as string | undefined,
    username: payload['cognito:username'] as string | undefined,
  }
}

/**
 * Full logout: clears the local session, then sends the browser through the
 * Cognito (or Azure AD) Hosted UI logout so the IdP session ends too.
 */
export const handleLogout = async () => {
  const postLogoutRedirectUri = `${window.location.origin}/`
  const cognitoLogoutUrl =
    `https://${COGNITO_DOMAIN}/logout` +
    `?client_id=${encodeURIComponent(COGNITO_APP_CLIENT_ID)}` +
    `&logout_uri=${encodeURIComponent(postLogoutRedirectUri)}`
  const azureLogoutUrl = AZURE_TENANT_ID
    ? `https://login.microsoftonline.com/${encodeURIComponent(
        AZURE_TENANT_ID,
      )}/oauth2/v2.0/logout` +
      `?post_logout_redirect_uri=${encodeURIComponent(cognitoLogoutUrl)}`
    : cognitoLogoutUrl

  let authProvider = 'cognito'

  try {
    const session = await fetchAuthSession({ forceRefresh: false }).catch(
      () => null,
    )
    authProvider =
      localStorage.getItem(AUTH_PROVIDER_STORAGE_KEY) ||
      detectAuthProviderFromSession(session)

    await doSignOut()
  } catch (error) {
    console.error('[handleLogout] unexpected error:', error)
  } finally {
    setAnonymous()
    localStorage.removeItem(AUTH_PROVIDER_STORAGE_KEY)
    sessionStorage.clear()
    clearSessionTokens()
  }

  window.location.assign(
    authProvider === 'azure' ? azureLogoutUrl : cognitoLogoutUrl,
  )
}

/** Called when the API reports a 401 — drops the local session and returns to sign-in. */
export const handleSessionExpired = () => {
  setAnonymous()
  clearSessionTokens()
  localStorage.removeItem(AUTH_PROVIDER_STORAGE_KEY)
  sessionStorage.clear()
  window.location.assign('/')
}

/** Wires the Cognito session into the shared axios client. Call once at startup. */
export const initAuth = () => {
  setTokenProvider(() => getFreshAccessToken())
  setUnauthorizedHandler(handleSessionExpired)
}
