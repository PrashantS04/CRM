import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import { useId } from 'react'
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { FormField } from './FormField'
import { toOption, type SelectOptions } from './selectOptions'

export interface FormSelectProps<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label: string
  options: SelectOptions
  hint?: string
  fullWidth?: boolean
}

/** Dropdown bound to React Hook Form. */
export function FormSelect<T extends FieldValues>({
  name,
  control,
  label,
  options,
  hint,
  fullWidth,
}: FormSelectProps<T>) {
  const id = useId()
  const { field, fieldState } = useController({ name, control })
  return (
    <FormField
      id={id}
      label={label}
      error={fieldState.error?.message}
      hint={hint}
      fullWidth={fullWidth}
    >
      <Select
        {...field}
        value={field.value ?? ''}
        id={id}
        displayEmpty
        fullWidth
        error={Boolean(fieldState.error)}
        inputProps={{ 'aria-label': label }}
      >
        {options.map((option) => {
          const { value, label: text } = toOption(option)
          return (
            <MenuItem key={value} value={value}>
              {text}
            </MenuItem>
          )
        })}
      </Select>
    </FormField>
  )
}
