import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type DefaultValues, type FieldValues } from 'react-hook-form'
import type { z } from 'zod'

/** React Hook Form wired to a zod schema — one line per form instead of repeated boilerplate. */
export function useZodForm<S extends z.ZodType<FieldValues, FieldValues>>(
  schema: S,
  defaultValues: DefaultValues<z.infer<S>>,
) {
  return useForm<z.infer<S>>({
    resolver: zodResolver(schema) as never,
    defaultValues,
    mode: 'onTouched',
  })
}
