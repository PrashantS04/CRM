import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type TextFieldSize = 'md' | 'sm'

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode
  error?: string
  required?: boolean
  size?: TextFieldSize
  containerClassName?: string
  labelClassName?: string
  errorClassName?: string
}

const SIZE_CLASSES: Record<
  TextFieldSize,
  { label: string; input: string; error: string }
> = {
  md: {
    label: 'mb-1.5 text-sm',
    input: 'h-11',
    error: 'mt-1 text-xs',
  },
  sm: {
    label: 'mb-1 text-xs',
    input: 'h-9',
    error: 'mt-0.5 text-[11px]',
  },
}

/** Controlled text input with optional label, required marker and inline error. */
export function TextField({
  id,
  label,
  error,
  required = false,
  size = 'md',
  containerClassName,
  labelClassName,
  errorClassName,
  className,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const sizeClasses = SIZE_CLASSES[size]

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block font-semibold text-ink',
            sizeClasses.label,
            labelClassName,
          )}
        >
          {label} {required && <span className="text-brand">*</span>}
        </label>
      )}
      <input
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'w-full rounded-md border px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand disabled:bg-surface-alt',
          error ? 'border-brand' : 'border-line-strong',
          sizeClasses.input,
          className,
        )}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className={cn('text-brand', sizeClasses.error, errorClassName)}>
          {error}
        </p>
      )}
    </div>
  )
}
