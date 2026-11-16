import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAuthSession } from '@aws-amplify/auth'
import { Hub } from '@aws-amplify/core'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useToast } from '@/components/feedback/toastContext'
import {
  COGNITO_APP_CLIENT_ID,
  COGNITO_DOMAIN,
  COGNITO_REDIRECT_SIGN_IN,
} from '@/sso/config'
import { completeAuthenticatedSession } from './completeAuthSession'
import { clearPendingUsername } from './pendingSignIn'

/**
 * Manually exchanges the OAuth authorization code for tokens. Needed because
 * the Azure sign-in URL is built by hand (Amplify drops the `prompt` param
 * for custom providers, so Amplify never sees its own state/PKCE).
 */
const exchangeCodeForTokens = async (code: string) => {
  const tokenEndpoint = `https://${COGNITO_DOMAIN}/oauth2/token`

  const params = new URLSearchParams()
  params.append('grant_type', 'authorization_code')
  params.append('client_id', COGNITO_APP_CLIENT_ID)
  params.append('code', code)
  params.append('redirect_uri', COGNITO_REDIRECT_SIGN_IN)

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Token exchange failed: ${response.status} - ${errorText}`)
  }

  return response.json() as Promise<{
    id_token: string
    access_token: string
    refresh_token?: string
  }>
}

/** Landing page for the Cognito Hosted UI redirect (`/home`). */
export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { error: showError } = useToast()
  const [failed, setFailed] = useState(false)
  const flowInFlightRef = useRef(false)
  const flowCompletedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    const finishLogin = async (session: Awaited<ReturnType<typeof fetchAuthSession>> | null) => {
      if (flowCompletedRef.current || flowInFlightRef.current) return
      flowInFlightRef.current = true

      try {
        if (!session?.tokens?.idToken) {
          const fetched = await fetchAuthSession()
          if (!fetched?.tokens?.idToken) {
            throw new Error('No active Cognito session found')
          }
          session = fetched
        }

        await completeAuthenticatedSession()
        clearPendingUsername()
        flowCompletedRef.current = true
        navigate('/dashboard', { replace: true })
      } catch (err) {
        if (cancelled) return
        console.error('[AuthCallback] login completion failed:', err)
        setFailed(true)
        showError('Login failed! Redirecting...')
        setTimeout(() => navigate('/', { replace: true }), 2000)
      } finally {
        flowInFlightRef.current = false
      }
    }

    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const hasCode = Boolean(code)
    const hasState = urlParams.has('state')

    if (hasCode && code) {
      // Manual OAuth code exchange since the authorize URL was constructed manually.
      void (async () => {
        try {
          const tokenResponse = await exchangeCodeForTokens(code)

          // Store tokens manually since Amplify won't do it.
          const prefix = `CognitoIdentityServiceProvider.${COGNITO_APP_CLIENT_ID}`
          localStorage.setItem(`${prefix}.LastAuthUser`, 'azure-ad-user')
          localStorage.setItem(`${prefix}.azure-ad-user.idToken`, tokenResponse.id_token)
          localStorage.setItem(`${prefix}.azure-ad-user.accessToken`, tokenResponse.access_token)
          if (tokenResponse.refresh_token) {
            localStorage.setItem(`${prefix}.azure-ad-user.refreshToken`, tokenResponse.refresh_token)
          }
          localStorage.setItem(`${prefix}.azure-ad-user.clockDrift`, '0')

          const session = await fetchAuthSession()
          if (session?.tokens?.idToken) {
            await finishLogin(session)
          } else {
            throw new Error('Could not establish session after token exchange')
          }
        } catch (err) {
          if (cancelled) return
          console.error('[AuthCallback] token exchange failed:', err)
          setFailed(true)
          showError('Login failed. Please try again.')
        }
      })()
      return () => {
        cancelled = true
      }
    }

    const cancelHub = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        cancelHub()
        void finishLogin(null)
      } else if (payload.event === 'signInWithRedirect_failure') {
        cancelHub()
        if (cancelled) return
        console.error('[AuthCallback] signInWithRedirect_failure:', payload)
        setFailed(true)
        showError('Login failed! Redirecting...')
      }
    })

    if (!hasCode && !hasState) {
      // No OAuth redirect params — try to complete an existing session.
      void finishLogin(null)
    } else {
      // OAuth params present — Amplify completes the exchange and fires signedIn.
      const timeoutId = setTimeout(() => {
        cancelHub()
        if (cancelled) return
        console.error('[AuthCallback] Hub event timeout')
        setFailed(true)
        showError('Login timed out. Please try again.')
      }, 15000)

      return () => {
        cancelled = true
        clearTimeout(timeoutId)
        cancelHub()
      }
    }

    return () => {
      cancelled = true
      cancelHub()
    }
  }, [navigate, showError])

  if (failed) {
    return (
      <div className="bg-surface-alt flex min-h-screen items-center justify-center">
        <div className="bg-surface max-w-md rounded-lg p-8 text-center shadow-lg">
          <h2 className="text-xl font-bold text-ink">Authentication Failed</h2>
          <p className="mt-2 text-muted">Redirecting you to login page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen place-items-center">
      <PageLoader />
    </div>
  )
}
