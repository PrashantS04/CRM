import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAuthSession } from '@aws-amplify/auth'
import Watermark from './Watermark'
import loginBgVid from '@/assets/video/login-bg.mp4'
import {
  clearSessionTokens,
  getAccessToken,
  isTokenExpired,
} from '@/services/session-manager'
import { setAnonymous } from './authStore'

/** Shared frame for the auth pages: background video, headline and watermark. */
export function AuthLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const localToken = getAccessToken()
        if (localToken && !isTokenExpired(localToken)) {
          navigate('/dashboard', { replace: true })
          return
        }
        if (localToken) {
          clearSessionTokens()
        }

        const session = await fetchAuthSession({ forceRefresh: false })
        if (session?.tokens?.accessToken) {
          navigate('/dashboard', { replace: true })
          return
        }

        setAnonymous()
      } catch {
        // No valid session — show the auth page.
        setAnonymous()
      } finally {
        setChecking(false)
      }
    }

    void checkSession()
  }, [navigate])

  if (checking) return null

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden">
      <Watermark className="z-[99999]" />
      <video
        src={loginBgVid}
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 h-full w-full object-cover"
      />
      <div className="fixed inset-0 bg-black/40" />

      <div className="relative z-10 flex min-h-[100dvh] w-full min-w-0 items-stretch overflow-y-auto md:items-center md:px-6 md:py-8 xl:px-12 xl:py-10">
        <div className="mx-auto grid w-full min-w-0 max-w-[1400px] grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8 xl:gap-12">
          <div className="hidden min-w-0 text-white md:block">
            <h1 className="font-montserrat text-[36px] leading-tight font-semibold tracking-tight md:text-[42px] xl:text-[56px] xl:leading-[1.2] 2xl:text-[60px]">
              Investing. Financing. <br />
              Delivered Differently.
            </h1>

            <p className="mt-4 max-w-full break-words text-base leading-snug font-medium text-white md:text-lg xl:mt-6 xl:text-xl 2xl:text-2xl">
              Private Investment House + Private Commercial Finance Partner to
              the Property Sector
            </p>
          </div>

          <div className="flex w-full min-w-0 md:w-auto md:max-w-[500px] md:shrink-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
