import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
// import { getPendingUsername, savePendingUsername } from '../pendingSignIn'
import AuthCard from './AuthCard'

const AzureIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#F25022" d="M0 0h8.5v8.5H0z" />
    <path fill="#7FBA00" d="M9.5 0H18v8.5H9.5z" />
    <path fill="#00A4EF" d="M0 9.5h8.5V18H0z" />
    <path fill="#FFB900" d="M9.5 9.5H18V18H9.5z" />
  </svg>
)

const SignInForm = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')

  const handleNext = (event: FormEvent) => {
    event.preventDefault()
    // const nextUsername = username.trim()
    // if (!nextUsername) {
    //   setUsernameError('Please enter your username.')
    //   return
    // }
    // setUsernameError('')

    // savePendingUsername(nextUsername)
    navigate('/enter-password', { state: { username: username.trim() } })
    // navigate('/enter-password', { state: { username: nextUsername } })
  }

  return (
    <AuthCard>
      <h2 className="mb-6 text-center font-montserrat text-[28px] font-semibold text-ink">
        Sign in
      </h2>

      <div className="w-full">
        <p className="mb-3 text-sm font-medium text-ink">With other accounts</p>
        <button
          type="button"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-ink bg-white text-sm font-medium text-ink transition hover:bg-surface-alt"
        >
          <AzureIcon />
          Continue with Azure-AD-Login
        </button>
      </div>

      <div className="my-6 flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-sm text-muted">Or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form className="w-full" onSubmit={handleNext}>
        <p className="mb-3 text-sm font-medium text-ink">With existing account</p>
        <label
          htmlFor="username"
          className="mb-1.5 block text-sm font-semibold text-ink"
        >
          Username <span className="text-brand">*</span>
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value)
            setUsernameError('')
          }}
          placeholder="Enter username"
          className={`mb-2 h-11 w-full rounded-md border px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand ${
            usernameError ? 'border-brand' : 'border-line-strong'
          }`}
        />
        {usernameError && (
          <p className="mb-3 text-xs text-brand">{usernameError}</p>
        )}

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center rounded-md bg-brand text-base font-semibold text-white transition hover:bg-brand-dark"
        >
          Next
        </button>
      </form>
    </AuthCard>
  )
}

export default SignInForm
