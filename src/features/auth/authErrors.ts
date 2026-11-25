type AuthErrorLike = {
  name?: string
  code?: string
  message?: string
}

/** Maps Cognito/Amplify error names to user-friendly messages. */
export const getAuthErrorMessage = (error: unknown): string => {
  const err = error as AuthErrorLike | null | undefined
  const name = err?.name || err?.code || ''
  const fallback = err?.message || 'Something went wrong. Please try again.'

  switch (name) {
    case 'NotAuthorizedException':
      return 'Incorrect username or password.'
    case 'UserNotFoundException':
      return 'No account found for that username.'
    case 'UserNotConfirmedException':
      return 'This account is not confirmed. Please verify your email first.'
    case 'PasswordResetRequiredException':
      return 'You must reset your password before signing in.'
    case 'InvalidPasswordException':
      return err?.message || 'Password does not meet the required policy.'
    case 'LimitExceededException':
    case 'TooManyRequestsException':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'CodeMismatchException':
      return 'Invalid verification code.'
    case 'ExpiredCodeException':
      return 'That verification code has expired. Please request a new one.'
    case 'InvalidParameterException':
      return (
        err?.message || 'Please check the details you entered and try again.'
      )
    default:
      return fallback
  }
}
