import { ChevronDown, LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { CURRENT_USER } from '@/constants/lists'
import { useAuth, type AuthUser } from '@/features/auth/authStore'
import { LogoutConfirm } from './LogoutConfirm'

function displayName(user: AuthUser | null): string {
  return user?.name || user?.username || user?.email || CURRENT_USER
}

/** Top-right avatar menu: signed-in user details and a logout action. */
export function UserMenu() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const name = displayName(user)
  const detail = user?.email && user.email !== name ? user.email : user?.username || null

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-[9px] font-semibold"
      >
        <Avatar name={name} />
        <span className="hidden sm:inline">{name}</span>
        <ChevronDown size={16} className="text-muted" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="bg-surface border-line absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border shadow-lg"
        >
          <div className="p-3">
            <div className="flex items-center gap-3">
              <Avatar name={name} />
              <div className="min-w-0">
                <p className="text-muted m-0 text-[11px] font-medium">Signed in as</p>
                <p className="text-ink m-0 truncate text-[15px] font-semibold">{name}</p>
              </div>
            </div>
            {detail && (
              <div className="border-line bg-surface-alt mt-3 rounded-lg border p-2">
                <span className="text-subtle block truncate text-xs">{detail}</span>
              </div>
            )}
          </div>

          <div className="border-line px-3">
            <hr className="border-line m-0" />
          </div>

          <div className="p-3">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                setConfirmOpen(true)
              }}
              className="text-ink hover:bg-brand-tint hover:text-brand flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
            >
              <span className="flex-1 text-left">Logout</span>
              <LogOut size={18} aria-hidden />
            </button>
          </div>
        </div>
      )}

      <LogoutConfirm open={confirmOpen} onClose={() => setConfirmOpen(false)} />
    </div>
  )
}
