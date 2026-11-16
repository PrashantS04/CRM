import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField } from '@/components/form'
import { Button } from '@/components/ui'
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
        <Button
          type="button"
          variant="secondary"
          startIcon={<AzureIcon />}
          className="h-11 w-full gap-2 rounded-md border-ink bg-white text-sm font-medium text-ink hover:bg-surface-alt"
        >
          Continue with Azure-AD-Login
        </Button>
      </div>

      <div className="my-6 flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-sm text-muted">Or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form className="w-full" onSubmit={handleNext}>
        <p className="mb-3 text-sm font-medium text-ink">With existing account</p>
        <TextField
          id="username"
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
          placeholder="Enter username"
          error={usernameError}
          containerClassName="mb-4"
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          className="h-12 rounded-md text-base font-semibold"
        >
          Next
        </Button>
      </form>
    </AuthCard>
  )
}

export default SignInForm
