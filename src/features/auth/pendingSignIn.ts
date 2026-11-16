const PENDING_USERNAME_KEY = 'pi.pendingUsername'

export function getPendingUsername(): string {
  return sessionStorage.getItem(PENDING_USERNAME_KEY) ?? ''
}

export function savePendingUsername(username: string): void {
  sessionStorage.setItem(PENDING_USERNAME_KEY, username)
}

export function clearPendingUsername(): void {
  sessionStorage.removeItem(PENDING_USERNAME_KEY)
}
