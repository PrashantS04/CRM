import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Checkbox, TextField } from '@/components/form'
import { Button } from '@/components/ui'
import { getPendingUsername } from '../pendingSignIn'
import AuthCard from './AuthCard'

const PasswordForm = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const username =
    (location.state as { username?: string } | null)?.username || getPendingUsername()

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // New password challenge UI state
  const [needsNewPassword, setNeedsNewPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [givenName, setGivenName] = useState('')
  const [preferredUsername, setPreferredUsername] = useState('')

  // Field errors
  const [passwordError, setPasswordError] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [preferredUsernameError, setPreferredUsernameError] = useState('')

  // Live password policy checks
  const passwordCriteria = [
    {
      id: 'length',
      label: 'Min. 8 characters',
      isValid: newPassword.length >= 8,
    },
    {
      id: 'number',
      label: 'Use a number',
      isValid: /\d/.test(newPassword),
    },
    {
      id: 'lowercase',
      label: 'Lowercase letter',
      isValid: /[a-z]/.test(newPassword),
    },
    {
      id: 'uppercase',
      label: 'Uppercase letter',
      isValid: /[A-Z]/.test(newPassword),
    },
    {
      id: 'special',
      label: 'Special character',
      isValid: /[^A-Za-z0-9]/.test(newPassword),
    },
  ]
  // const allCriteriaMet = passwordCriteria.every((c) => c.isValid)

  const handleContinue = (event: FormEvent) => {
    event.preventDefault()
    // if (!password) {
    //   setPasswordError('Please enter your password.')
    //   return
    // }
    // setPasswordError('')
    navigate('/dashboard')
  }

  const handleNewPassword = (event: FormEvent) => {
    event.preventDefault()
    navigate('/dashboard')

    // let hasError = false
    //
    // if (!newPassword) {
    //   setNewPasswordError('Please enter your new password.')
    //   hasError = true
    // } else if (!allCriteriaMet) {
    //   setNewPasswordError('Password does not meet the required policy.')
    //   hasError = true
    // } else {
    //   setNewPasswordError('')
    // }
    //
    // if (!confirmPassword) {
    //   setConfirmPasswordError('Please confirm your new password.')
    //   hasError = true
    // } else if (newPassword !== confirmPassword) {
    //   setConfirmPasswordError('Passwords do not match.')
    //   hasError = true
    // } else {
    //   setConfirmPasswordError('')
    // }
    //
    // if (!preferredUsername.trim()) {
    //   setPreferredUsernameError('Please enter your preferred username.')
    //   hasError = true
    // } else {
    //   setPreferredUsernameError('')
    // }
    //
    // if (hasError) return
  }

  const handleBack = () => {
    if (needsNewPassword) {
      setNeedsNewPassword(false)
      setPassword('')
      setPasswordError('')
      setNewPassword('')
      setConfirmPassword('')
      setNewPasswordError('')
      setConfirmPasswordError('')
      setPreferredUsernameError('')
    } else {
      navigate('/')
    }
  }

  return (
    <AuthCard
      className={
        needsNewPassword
          ? 'my-auto p-6 sm:p-7 md:max-w-[440px] md:w-[min(440px,100%)] md:p-7'
          : ''
      }
    >
      <h2
        className={`text-center font-montserrat font-semibold text-ink ${
          needsNewPassword ? 'mb-1 text-[22px]' : 'mb-6 text-[26px]'
        }`}
      >
        {needsNewPassword ? 'Change password' : 'Enter your password'}
      </h2>

      {needsNewPassword && (
        <p className="mb-4 text-center text-xs text-muted">
          Please choose a unique password to secure your account.
        </p>
      )}

      <form
        className="w-full"
        onSubmit={needsNewPassword ? handleNewPassword : handleContinue}
      >
        {!needsNewPassword ? (
          <>
            <TextField
              id="password"
              name="password"
              label="Password"
              required
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setPasswordError('')
              }}
              error={passwordError}
              containerClassName="mb-2"
            />

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Checkbox
                id="show-password"
                checked={showPassword}
                onChange={setShowPassword}
                label="Show password"
              />
              <Button
                type="button"
                variant="link"
                className="shrink-0 text-sm font-medium text-brand hover:underline sm:text-right"
                onClick={() =>
                  navigate('/forgot-password', { state: { username } })
                }
              >
                Forgot your password?
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* 1. New password */}
            <TextField
              id="new-password"
              name="new-password"
              label="New password"
              required
              size="sm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword}
              placeholder="Enter new password"
              onChange={(event) => {
                setNewPassword(event.target.value)
                setNewPasswordError('')
              }}
              error={newPasswordError}
              containerClassName="mb-1.5"
            />

            {/* Password Policy Criteria Checklist */}
            <ul className="mb-2.5 mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
              {passwordCriteria.map((criterion, idx) => (
                <li
                  key={criterion.id}
                  className={`flex items-center gap-1.5 transition-colors ${
                    idx === 4 ? 'col-span-2' : ''
                  } ${
                    criterion.isValid ? 'font-medium text-success' : 'text-muted'
                  }`}
                >
                  <span
                    className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      criterion.isValid
                        ? 'border-success bg-success text-white'
                        : 'border-line-strong bg-transparent'
                    }`}
                  >
                    {criterion.isValid ? (
                      <Check size={8} strokeWidth={3} />
                    ) : (
                      <span className="h-0.5 w-0.5 rounded-full bg-subtle" />
                    )}
                  </span>
                  <span className="truncate">{criterion.label}</span>
                </li>
              ))}
            </ul>

            {/* 2. Confirm new password */}
            <TextField
              id="confirm-password"
              name="confirm-password"
              label="Confirm new password"
              required
              size="sm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              placeholder="Re-enter new password"
              onChange={(event) => {
                setConfirmPassword(event.target.value)
                setConfirmPasswordError('')
              }}
              error={confirmPasswordError}
              containerClassName="mb-2"
            />

            {/* Show Password Toggle */}
            <div className="mb-2.5">
              <Checkbox
                id="show-new-password"
                checked={showPassword}
                onChange={setShowPassword}
                label="Show password"
              />
            </div>

            {/* 3. Family name */}
            <TextField
              id="family-name"
              name="family-name"
              label="Family name"
              size="sm"
              type="text"
              value={familyName}
              placeholder="Enter your family name or last name"
              onChange={(event) => {
                setFamilyName(event.target.value)
              }}
              containerClassName="mb-2"
            />

            {/* 4. Given name */}
            <div className="mb-2">
              <label
                htmlFor="given-name"
                className="mb-1 block text-xs font-semibold text-ink"
              >
                Given name
              </label>
              <input
                id="given-name"
                name="given-name"
                type="text"
                value={givenName}
                placeholder="Enter your given name or first name"
                onChange={(event) => {
                  setGivenName(event.target.value)
                }}
                className="h-9 w-full rounded-md border border-line-strong px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* 5. Preferred username */}
            <div className="mb-3.5">
              <label
                htmlFor="preferred-username"
                className="mb-1 block text-xs font-semibold text-ink"
              >
                Preferred username <span className="text-brand">*</span>
              </label>
              <input
                id="preferred-username"
                name="preferred-username"
                type="text"
                autoComplete="username"
                value={preferredUsername}
                placeholder="Enter your preferred username"
                onChange={(event) => {
                  setPreferredUsername(event.target.value)
                  setPreferredUsernameError('')
                }}
                className={`h-9 w-full rounded-md border px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand ${
                  preferredUsernameError ? 'border-brand' : 'border-line-strong'
                }`}
              />
              {preferredUsernameError && (
                <p className="mt-0.5 text-[11px] text-brand">
                  {preferredUsernameError}
                </p>
              )}
            </div>
          </>
        )}

        <button
          type="submit"
          className="mb-2 flex h-10 w-full items-center justify-center rounded-md bg-brand text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          {needsNewPassword ? 'Change password' : 'Continue'}
        </button>

        <button
          type="button"
          onClick={handleBack}
          className="flex h-10 w-full items-center justify-center rounded-md border border-brand bg-white text-sm font-semibold text-brand transition hover:bg-brand-tint"
        >
          Back
        </button>
      </form>
    </AuthCard>
  )
}

export default PasswordForm
