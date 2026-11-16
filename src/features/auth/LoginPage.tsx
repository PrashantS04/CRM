import { AuthLayout } from './AuthLayout'
import SignInForm from './components/SignInForm'

export function LoginPage() {
  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  )
}
