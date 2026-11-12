import { buildCssVariables } from './cssVars'
import { palette } from './tokens'

describe('design tokens → CSS variables', () => {
  const vars = buildCssVariables()

  it('exposes every palette colour as a --pi-* variable', () => {
    expect(vars['--pi-brand']).toBe(palette.brand)
    expect(vars['--pi-brand-dark']).toBe(palette.brandDark)
    expect(vars['--pi-chart1']).toBe(palette.chart1)
  })

  it('exposes radii and shadows', () => {
    expect(vars['--pi-radius-card']).toBeDefined()
    expect(vars['--pi-shadow-card']).toBeDefined()
  })
})
