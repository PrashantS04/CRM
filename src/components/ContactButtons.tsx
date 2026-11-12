import { Mail, Phone } from 'lucide-react'
import { buildCallHref, buildEmailHref } from '@/lib/contact'
import { Button, type ButtonProps } from '@/components/ui/Button'

type ContactButtonProps = Omit<ButtonProps, 'href' | 'startIcon' | 'children'> & { label?: string }

/** Call button: Teams on desktop, phone dialler on mobile (brief §3.6.2). */
export function CallButton({
  phone,
  label = 'Call',
  ...rest
}: ContactButtonProps & { phone: string }) {
  return (
    <Button href={buildCallHref(phone)} startIcon={<Phone size={15} />} {...rest}>
      {label}
    </Button>
  )
}

/** Email button: opens a new message in the default mail client / Outlook (brief §3.6.3). */
export function EmailButton({
  email,
  label = 'Email',
  ...rest
}: ContactButtonProps & { email: string }) {
  return (
    <Button href={buildEmailHref(email)} startIcon={<Mail size={15} />} {...rest}>
      {label}
    </Button>
  )
}
