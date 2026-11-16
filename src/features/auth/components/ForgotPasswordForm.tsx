import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { TextField } from '@/components/form'
import { Button } from '@/components/ui'
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
        <TextField
          id="reset-username"
          name="username"
          label="Username"
          required
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value)
            setUsernameError('')
          }}
          disabled={codeSent}
          placeholder="Enter username"
          error={usernameError}
          containerClassName="mb-4"
        />

        {codeSent && (
          <>
            <TextField
              id="reset-code"
              name="code"
              label="Verification code"
              required
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value)
                setCodeError('')
              }}
              error={codeError}
              containerClassName="mb-4"
            />

            <TextField
              id="reset-new-password"
              name="new-password"
              label="New password"
              required
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value)
                setNewPasswordError('')
              }}
              error={newPasswordError}
              containerClassName="mb-4"
            />

            <TextField
              id="reset-confirm-password"
              name="confirm-password"
              label="Confirm password"
              required
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
                setConfirmPasswordError('')
              }}
              error={confirmPasswordError}
              containerClassName="mb-5"
            />
          </>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          className="mb-3 h-12 rounded-md text-base font-semibold"
        >
          {codeSent ? 'Update password' : 'Send code'}
        </Button>

        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => navigate('/')}
          className="h-12 rounded-md border-brand bg-white text-base font-semibold text-brand hover:bg-brand-tint"
        >
          Back to sign in
        </Button>
      </form>
    </AuthCard>
  )
}

export default ForgotPasswordForm
