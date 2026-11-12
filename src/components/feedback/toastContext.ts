import { createContext, useContext } from 'react'

export type ToastSeverity = 'success' | 'info' | 'error'

export interface ToastApi {
  success: (message: string) => void
  info: (message: string) => void
  error: (message: string) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
