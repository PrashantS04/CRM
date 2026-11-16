import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { handleLogout } from '@/services/auth'

export interface LogoutConfirmProps {
  open: boolean
  onClose: () => void
}

/** Confirms before running the full Cognito/Azure AD logout redirect. */
export function LogoutConfirm({ open, onClose }: LogoutConfirmProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const confirm = async () => {
    setIsLoggingOut(true)
    try {
      await handleLogout()
    } catch (error) {
      console.error('Logout failed:', error)
      setIsLoggingOut(false)
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      title="Logout"
      onClose={() => !isLoggingOut && onClose()}
      maxWidth={420}
      footer={
        <>
          <Button onClick={onClose} disabled={isLoggingOut}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirm} disabled={isLoggingOut}>
            {isLoggingOut ? 'Logging out…' : 'Logout'}
          </Button>
        </>
      }
    >
      <p className="text-muted m-0 p-[22px] pb-6 text-[13px]">Are you sure you want to log out?</p>
    </Modal>
  )
}
