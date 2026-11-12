/** Brief §3.6.2 / §3.6.3: call via Teams on desktop, dialler on mobile; email opens Outlook. */

export function isMobileDevice(userAgent: string = navigator.userAgent): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)
}

const stripSpaces = (phone: string) => phone.replace(/[^\d+]/g, '')

export function buildCallHref(phone: string, mobile: boolean = isMobileDevice()): string {
  const number = stripSpaces(phone)
  return mobile ? `tel:${number}` : `msteams:/l/call/0/0?users=4:${number}`
}

export function buildEmailHref(email: string): string {
  return `mailto:${email}`
}
