import { Amplify } from 'aws-amplify'
import {
  confirmSignIn,
  fetchAuthSession,
  getCurrentUser,
  resetPassword,
  confirmResetPassword,
  signIn,
  signInWithRedirect,
  signOut,
} from '@aws-amplify/auth'
import type { AuthSession, SignInOutput } from '@aws-amplify/auth'

export const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN as string
export const COGNITO_APP_CLIENT_ID = import.meta.env
  .VITE_COGNITO_APP_CLIENT_ID as string
export const COGNITO_REDIRECT_SIGN_IN = import.meta.env
  .VITE_COGNITO_REDIRECT_SIGN_IN as string
export const AZURE_TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID as string

export const AZURE_IDP_NAME =
  (import.meta.env.VITE_AZURE_IDP_NAME as string | undefined) || 'Azure-AD-LogIn'

export const AUTH_PROVIDER_STORAGE_KEY = 'auth-provider'
export type AuthProvider = 'azure' | 'cognito' | 'unknown'

/** Detects whether the session came from Azure AD federation or native Cognito. */
export const detectAuthProviderFromSession = (
  session: AuthSession | null | undefined,
): AuthProvider => {
  const accessToken = session?.tokens?.accessToken
  if (!accessToken) return 'unknown'

  const payload = accessToken.payload as Record<string, unknown>
  const username = String(payload?.username ?? '')
  const groups = (payload?.['cognito:groups'] as unknown[]) ?? []
  const isAzureFederated =
    username.toLowerCase().startsWith('azure-ad') ||
    groups.some(
      (group) =>
        typeof group === 'string' && group.toLowerCase().includes('azure-ad'),
    )

  return isAzureFederated ? 'azure' : 'cognito'
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID as string,
      userPoolClientId: COGNITO_APP_CLIENT_ID,
      loginWith: {
        username: true,
        email: true,
        oauth: {
          domain: COGNITO_DOMAIN,
          scopes: ['email', 'openid', 'phone', 'profile'],
          redirectSignIn: [COGNITO_REDIRECT_SIGN_IN],
          redirectSignOut: [import.meta.env.VITE_COGNITO_REDIRECT_SIGN_OUT as string],
          responseType: 'code',
        },
      },
    },
  },
})

/** Generic sign-in via Cognito Hosted UI (kept for Azure federation fallbacks). */
export const signInWithHostedUI = async () => {
  try {
    localStorage.removeItem(AUTH_PROVIDER_STORAGE_KEY)
    await getCurrentUser()
    window.location.replace('/dashboard')
    return
  } catch {
    // No local session — proceed to Hosted UI.
  }

  try {
    await signOut()
  } catch {
    // Safe to ignore.
  }

  await signInWithRedirect()
}

/**
 * Username/password sign-in against the Cognito user pool (custom UI).
 * Requires ALLOW_USER_SRP_AUTH (or ALLOW_USER_PASSWORD_AUTH) on the app client.
 */
export const signInWithUsernamePassword = async (
  username: string,
  password: string,
): Promise<SignInOutput> => {
  localStorage.removeItem(AUTH_PROVIDER_STORAGE_KEY)
  try {
    return await signIn({
      username: username.trim(),
      password,
    })
  } catch (error) {
    if ((error as { name?: string })?.name === 'UserAlreadyAuthenticatedException') {
      return { isSignedIn: true, nextStep: { signInStep: 'DONE' } } as SignInOutput
    }
    throw error
  }
}

export const confirmNewPasswordChallenge = async (
  newPassword: string,
  userAttributes: Record<string, unknown> = {},
) => {
  const cleanedAttributes: Record<string, string> = {}
  for (const [key, value] of Object.entries(userAttributes)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      cleanedAttributes[key] = String(value).trim()
    }
  }

  const hasAttributes = Object.keys(cleanedAttributes).length > 0
  return confirmSignIn({
    challengeResponse: newPassword,
    ...(hasAttributes ? { options: { userAttributes: cleanedAttributes } } : {}),
  })
}

export const startPasswordReset = async (username: string) => {
  return resetPassword({ username: username.trim() })
}

export const completePasswordReset = async ({
  username,
  confirmationCode,
  newPassword,
}: {
  username: string
  confirmationCode: string
  newPassword: string
}) => {
  return confirmResetPassword({
    username: username.trim(),
    confirmationCode,
    newPassword,
  })
}

/**
 * IdP-specific sign-in — builds the authorize URL manually so we can
 * append &prompt=login (Amplify drops this param for custom providers).
 */
export const signInWithProvider = async (providerName: string) => {
  try {
    localStorage.removeItem(AUTH_PROVIDER_STORAGE_KEY)
    await signOut()
  } catch {
    // Safe to ignore.
  }

  const redirectUri = encodeURIComponent(COGNITO_REDIRECT_SIGN_IN)
  const clientId = encodeURIComponent(COGNITO_APP_CLIENT_ID)
  const idpName = encodeURIComponent(providerName)

  const authorizeUrl =
    `https://${COGNITO_DOMAIN}/oauth2/authorize` +
    `?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=email+openid+phone+profile` +
    `&identity_provider=${idpName}` +
    `&prompt=login`

  window.location.assign(authorizeUrl)
}

export const signInWithAzure = async () => {
  return signInWithProvider(AZURE_IDP_NAME)
}

/** Safely clears the local Amplify session without a global Cognito sign-out. */
export const doSignOut = async () => {
  try {
    await fetchAuthSession({ forceRefresh: false })
    await signOut()
  } catch (error) {
    console.warn(
      '[doSignOut] signOut failed (token likely already invalid):',
      (error as Error)?.message ?? error,
    )
  }
}
