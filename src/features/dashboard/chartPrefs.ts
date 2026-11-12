import { z } from 'zod'

export const prefsSchema = z.object({
  stage: z.boolean(),
  trend: z.boolean(),
  health: z.boolean(),
  owners: z.boolean(),
})

export type ChartPrefs = z.infer<typeof prefsSchema>

export const DEFAULT_CHART_PREFS: ChartPrefs = {
  stage: true,
  trend: true,
  health: true,
  owners: false,
}
