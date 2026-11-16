import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
// import { getPendingUsername, savePendingUsername } from '../pendingSignIn'
import AuthCard from './AuthCard'

const ForgotPasswordForm = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState(
    () => (location.state as { username?: string } | null)?.username || '',
  )
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [codeSent, setCodeSent] = useState(false)

  const [usernameError, setUsernameError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')

  const handleSendCode = (event: FormEvent) => {
    event.preventDefault()

    // const nextUsername = username.trim()
    // if (!nextUsername) {
    //   setUsernameError('Please enter your username.')
    //   return
    // }
    // setUsernameError('')

    // savePendingUsername(nextUsername)
    setCodeSent(true)
  }

  const handleReset = (event: FormEvent) => {
    event.preventDefault()
    navigate('/', { replace: true })

    // if (!code.trim()) {
    //   setCodeError('Please enter the verification code.')
    //   return
    // }
    // if (!newPassword) {
    //   setNewPasswordError('Please enter your new password.')
    //   return
    // }
    // if (!confirmPassword) {
    //   setConfirmPasswordError('Please confirm your new password.')
    //   return
    // }
    // if (newPassword !== confirmPassword) {
    //   setConfirmPasswordError('Passwords do not match.')
    //   return
    // }
    //
    // navigate('/', { replace: true })
  }

  return (
    <AuthCard>
      <h2 className="mb-6 text-center font-montserrat text-[26px] font-semibold text-ink">
        Reset your password
      </h2>

      <form className="w-full" onSubmit={codeSent ? handleReset : handleSendCode}>
        <label
          htmlFor="reset-username"
          className="mb-1.5 block text-sm font-semibold text-ink"
        >
          Username <span className="text-brand">*</span>
        </label>
        <input
          id="reset-username"
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value)
            setUsernameError('')
          }}
          disabled={codeSent}
          placeholder="Enter username"
          className={`mb-2 h-11 w-full rounded-md border px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand disabled:bg-surface-alt ${
            usernameError ? 'border-brand' : 'border-line-strong'
          }`}
        />
        {usernameError && (
          <p className="mb-4 text-xs text-brand">{usernameError}</p>
        )}

        {codeSent && (
          <>
            <label
              htmlFor="reset-code"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Verification code <span className="text-brand">*</span>
            </label>
            <input
              id="reset-code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value)
                setCodeError('')
              }}
              className={`mb-2 h-11 w-full rounded-md border px-3 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand ${
                codeError ? 'border-brand' : 'border-line-strong'
              }`}
            />
            {codeError && (
              <p className="mb-4 text-xs text-brand">{codeError}</p>
            )}

            <label
              htmlFor="reset-new-password"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              New password <span className="text-brand">*</span>
            </label>
            <input
              id="reset-new-password"
              name="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value)
                setNewPasswordError('')
              }}
              className={`mb-2 h-11 w-full rounded-md border px-3 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand ${
                newPasswordError ? 'border-brand' : 'border-line-strong'
              }`}
            />
            {newPasswordError && (
              <p className="mb-4 text-xs text-brand">{newPasswordError}</p>
            )}

            <label
              htmlFor="reset-confirm-password"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Confirm password <span className="text-brand">*</span>
            </label>
            <input
              id="reset-confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
                setConfirmPasswordError('')
              }}
              className={`mb-2 h-11 w-full rounded-md border px-3 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand ${
                confirmPasswordError ? 'border-brand' : 'border-line-strong'
              }`}
            />
            {confirmPasswordError && (
              <p className="mb-5 text-xs text-brand">{confirmPasswordError}</p>
            )}
          </>
        )}

        <button
          type="submit"
          className="mb-3 flex h-12 w-full items-center justify-center rounded-md bg-brand text-base font-semibold text-white transition hover:bg-brand-dark"
        >
          {codeSent ? 'Update password' : 'Send code'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex h-12 w-full items-center justify-center rounded-md border border-brand bg-white text-base font-semibold text-brand transition hover:bg-brand-tint"
        >
          Back to sign in
        </button>
      </form>
    </AuthCard>
  )
}

export default ForgotPasswordForm
