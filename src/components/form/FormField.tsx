import FormHelperText from '@mui/material/FormHelperText'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface FormFieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  /** Spans both columns of a dialog grid. */
  fullWidth?: boolean
  children: ReactNode
}

/** Label-above-control layout shared by every form control. */
export function FormField({ id, label, error, hint, fullWidth, children }: FormFieldProps) {
  return (
    <div className={cn(fullWidth && 'sm:col-span-2')}>
      <label htmlFor={id} className="text-text-soft mb-1.5 block text-xs font-bold">
        {label}
      </label>
      {children}
      {(error || hint) && (
        <FormHelperText id={`${id}-help`} error={Boolean(error)} sx={{ mx: 0 }}>
          {error ?? hint}
        </FormHelperText>
      )}
    </div>
  )
}
