import { Check } from 'lucide-react'
import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange'> {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
}

/** Accessible controlled checkbox with an optional label. */
export function Checkbox({
  id,
  checked,
  onChange,
  label,
  className,
  disabled,
  ...inputProps
}: CheckboxProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex select-none items-center gap-3',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}
    >
      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          {...inputProps}
        />
        <span
          className={cn(
            'pointer-events-none flex h-4 w-4 items-center justify-center rounded-[2px] border transition-colors peer-focus-visible:ring-1 peer-focus-visible:ring-brand',
            checked ? 'border-brand bg-brand' : 'border-line-strong bg-white',
          )}
        >
          {checked && <Check size={12} className="text-white" />}
        </span>
      </span>
      {label && <span className="flex-1 text-sm text-text">{label}</span>}
    </label>
  )
}
