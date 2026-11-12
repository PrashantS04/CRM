import OutlinedInput from '@mui/material/OutlinedInput'
import { useId } from 'react'
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { FormField } from './FormField'

export interface FormTextFieldProps<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label: string
  placeholder?: string
  type?: 'text' | 'email' | 'date' | 'number'
  multiline?: boolean
  hint?: string
  fullWidth?: boolean
}

/** Text input bound to React Hook Form, with label and error message. */
export function FormTextField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  type = 'text',
  multiline,
  hint,
  fullWidth,
}: FormTextFieldProps<T>) {
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
      <OutlinedInput
        {...field}
        value={field.value ?? ''}
        id={id}
        type={type}
        placeholder={placeholder}
        multiline={multiline}
        minRows={multiline ? 3 : undefined}
        error={Boolean(fieldState.error)}
        fullWidth
        inputProps={{
          'aria-invalid': Boolean(fieldState.error),
          'aria-describedby': fieldState.error || hint ? `${id}-help` : undefined,
        }}
      />
    </FormField>
  )
}
