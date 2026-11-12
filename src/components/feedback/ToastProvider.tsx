import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { useMemo, useState, type ReactNode } from 'react'
import { ToastContext, type ToastApi, type ToastSeverity } from './toastContext'

interface ToastState {
  message: string
  severity: ToastSeverity
  key: number
}

/** App-wide notifications (replaces browser `alert()`). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const [open, setOpen] = useState(false)

  const api = useMemo<ToastApi>(() => {
    const show = (severity: ToastSeverity) => (message: string) => {
      setToast({ message, severity, key: Date.now() })
      setOpen(true)
    }
    return { success: show('success'), info: show('info'), error: show('error') }
  }, [])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        key={toast?.key}
        open={open}
        autoHideDuration={4000}
        onClose={(_, reason) => reason !== 'clickaway' && setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{ transition: { onExited: () => setToast(null) } }}
      >
        <Alert
          severity={toast?.severity ?? 'info'}
          variant="filled"
          onClose={() => setOpen(false)}
          sx={{ width: '100%' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}
