import { z } from 'zod'
import { ENTITY_TYPES } from '@/constants/lists'
import { isValidAbn, isValidAcn } from '@/lib/validators'

/** Hard gate G2: an invalid format blocks the save and names the field. */
export const entitySchema = z.object({
  name: z.string().trim().min(1, 'Enter the Entity name'),
  type: z.enum(ENTITY_TYPES),
  acn: z
    .string()
    .refine(
      (value) => value.trim() === '' || isValidAcn(value),
      'ACN is not in a valid format (9 digits)',
    ),
  abn: z
    .string()
    .refine(
      (value) => value.trim() === '' || isValidAbn(value),
      'ABN is not in a valid format (11 digits)',
    ),
  owner: z.string().min(1, 'Choose an owner'),
})

export type EntityFormValues = z.infer<typeof entitySchema>
