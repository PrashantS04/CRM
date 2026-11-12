import Tab from '@mui/material/Tab'
import MuiTabs from '@mui/material/Tabs'

export interface TabItem<T extends string> {
  value: T
  label: string
}

export interface TabsProps<T extends string> {
  value: T
  onChange: (value: T) => void
  items: readonly TabItem<T>[]
  label: string
}

/** Underlined tab strip. Styling comes from the MUI theme (tokens). */
export function Tabs<T extends string>({ value, onChange, items, label }: TabsProps<T>) {
  return (
    <MuiTabs
      value={value}
      onChange={(_, next: T) => onChange(next)}
      aria-label={label}
      variant="scrollable"
      scrollButtons={false}
      sx={{ mb: 2.5 }}
    >
      {items.map((item) => (
        <Tab key={item.value} value={item.value} label={item.label} disableRipple />
      ))}
    </MuiTabs>
  )
}
