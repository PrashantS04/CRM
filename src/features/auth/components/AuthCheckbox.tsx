import { Check } from 'lucide-react'

type AuthCheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  id?: string
}

export default function AuthCheckbox({ checked, onChange, label, id }: AuthCheckboxProps) {
  const handleToggle = () => onChange(!checked)

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      handleToggle()
    }
  }

  return (
    <div
      id={id}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className="flex cursor-pointer select-none items-center gap-3"
    >
      <div
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border ${
          checked ? 'border-brand bg-brand' : 'border-line-strong bg-white'
        }`}
      >
        {checked && <Check size={12} className="text-white" />}
      </div>
      {label && <span className="flex-1 text-sm text-text">{label}</span>}
    </div>
  )
}
