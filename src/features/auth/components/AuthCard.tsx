import type { ReactNode } from 'react'
import logo from '@/assets/svg/logo.svg'

type AuthCardProps = {
  children: ReactNode
  className?: string
}

const AuthCard = ({ children, className = '' }: AuthCardProps) => {
  return (
    <div
      className={`box-border flex min-h-[100dvh] w-full min-w-0 flex-col items-center justify-center overflow-x-hidden bg-white md:min-h-[320px] md:rounded-2xl md:shadow-xl ${
        className
          ? className
          : 'p-6 sm:p-10 md:max-w-[420px] md:w-[min(420px,100%)] md:p-10 xl:p-12'
      }`}
    >
      <div className="flex w-full flex-col items-center">
        <img
          src={logo}
          alt="PrivateInvest Logo"
          className="mb-4 h-auto max-h-[22px] w-[150px] object-contain sm:max-h-[24px] sm:max-w-[min(240px,90%)] md:mb-6 md:max-h-[28px] md:w-full md:max-w-[min(276px,100%)]"
        />

        <div className="mb-6 w-full px-1 text-center md:hidden">
          <h1 className="font-montserrat text-[24px] leading-tight font-semibold tracking-tight text-ink sm:text-[26px]">
            Investing. Financing. <br />
            Delivered Differently.
          </h1>
          <p className="mx-auto mt-3 max-w-[320px] break-words text-sm leading-snug text-muted sm:mt-4 sm:max-w-[380px] sm:text-[15px]">
            Private Investment House + Private Commercial Finance Partner to the
            Property Sector
          </p>
        </div>
      </div>

      <div className="w-full">{children}</div>
    </div>
  )
}

export default AuthCard
