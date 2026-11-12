import { palette, radius, shadow } from './tokens'

const toKebab = (value: string) => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/** Flattens the design tokens into `--pi-*` CSS custom properties. */
export function buildCssVariables(): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const [key, value] of Object.entries(palette)) vars[`--pi-${toKebab(key)}`] = value
  for (const [key, value] of Object.entries(radius)) vars[`--pi-radius-${toKebab(key)}`] = value
  for (const [key, value] of Object.entries(shadow)) vars[`--pi-shadow-${toKebab(key)}`] = value
  return vars
}

/** Writes the tokens onto the document root. Call once, before the first render. */
export function applyCssVariables(root: HTMLElement = document.documentElement): void {
  for (const [name, value] of Object.entries(buildCssVariables())) {
    root.style.setProperty(name, value)
  }
}
