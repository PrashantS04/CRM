import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAuthSession } from '@aws-amplify/auth'
import { PageLoader } from '@/components/feedback/PageLoader'
import { completeAuthenticatedSession } from './completeAuthSession'
import { setAnonymous, setAuthChecking } from './authStore'

/**
 * Guards the authenticated app: verifies a Cognito session exists, hydrates
 * the auth store, and sends anonymous users back to sign-in.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const checkAuth = async () => {
      setAuthChecking()
      try {
        const session = await fetchAuthSession()
        if (session?.tokens?.accessToken) {
          await completeAuthenticatedSession().catch(() => undefined)
          setReady(true)
        } else {
          setAnonymous()
          navigate('/', { replace: true })
        }
      } catch {
        setAnonymous()
        navigate('/', { replace: true })
      }
    }

    void checkAuth()
  }, [navigate])

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <PageLoader />
      </div>
    )
  }
  return <>{children}</>
}
