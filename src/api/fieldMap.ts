import { FIELD_MAP_CATALOG, VALIDATION_RULES } from '@/mocks/fieldMap'
import { respond } from './http'

export const fieldMapApi = {
  catalog: () => respond(FIELD_MAP_CATALOG),
  validationRules: () => respond(VALIDATION_RULES),
}
