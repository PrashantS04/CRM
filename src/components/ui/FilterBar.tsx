import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { toOption, type SelectOptions } from '@/components/form'
import { cn } from '@/lib/cn'

/** Horizontal wrap container for search + filters + actions. */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-[18px] flex flex-wrap items-center gap-2.5', className)}>{children}</div>
  )
}

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** Accessible name (defaults to the placeholder). */
  label?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder, label, className }: SearchInputProps) {
  return (
    <OutlinedInput
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type="search"
      inputProps={{ 'aria-label': label ?? placeholder }}
      startAdornment={
        <InputAdornment position="start">
          <Search size={16} aria-hidden />
        </InputAdornment>
      }
      sx={{ width: { xs: '100%', sm: 270 } }}
      className={className}
    />
  )
}

export interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOptions
  /** Label for the "no filter" option, e.g. "All owners". Selected when value is "". */
  allLabel: string
}

export function FilterSelect({ value, onChange, options, allLabel }: FilterSelectProps) {
  return (
    <Select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      displayEmpty
      inputProps={{ 'aria-label': allLabel }}
      sx={{ minWidth: 140 }}
    >
      <MenuItem value="">{allLabel}</MenuItem>
      {options.map((option) => {
        const { value: optionValue, label } = toOption(option)
        return (
          <MenuItem key={optionValue} value={optionValue}>
            {label}
          </MenuItem>
        )
      })}
    </Select>
  )
}
