import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form'

export interface FormCheckboxProps<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label: string
}

/** Boolean checkbox bound to React Hook Form. */
export function FormCheckbox<T extends FieldValues>({
  name,
  control,
  label,
}: FormCheckboxProps<T>) {
  const { field } = useController({ name, control })
  return (
    <div className="sm:col-span-2">
      <FormControlLabel
        label={label}
        control={<Checkbox checked={Boolean(field.value)} onChange={field.onChange} />}
      />
    </div>
  )
}
