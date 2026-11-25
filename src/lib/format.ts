const currency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
})

const dateFormat = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const timeFormat = new Intl.DateTimeFormat('en-AU', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** "$60,000,000" — amounts are stored exactly and only formatted for display. */
export function formatCurrency(
  amount: number | null | undefined,
  fallback = 'Not entered',
): string {
  return amount == null ? fallback : currency.format(amount)
}

/** "$498m" — compact millions used on dashboards. */
export function formatMillions(amount: number): string {
  const millions = amount / 1_000_000
  return `$${Number.isInteger(millions) ? millions : millions.toFixed(1)}m`
}

export function formatDate(iso: string | null | undefined, fallback = 'Not set'): string {
  return iso ? dateFormat.format(new Date(iso)) : fallback
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return `${dateFormat.format(date)}, ${timeFormat.format(date)}`
}

export function getInitials(name: string): string {
  return name
    .replace(/\./g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/** Formats an ACN into 3-3-3 groups (e.g. "123 456 789"), capped at 9 digits. */
export function formatAcn(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9)
  const trailingSpace = value.endsWith(' ') && (digits.length === 3 || digits.length === 6)
  if (digits.length <= 3) return digits + (trailingSpace ? ' ' : '')
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}${trailingSpace ? ' ' : ''}`
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
}

/** Formats an ABN into 2-3-3-3 groups (e.g. "12 345 678 901"), capped at 11 digits. */
export function formatAbn(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  const trailingSpace = value.endsWith(' ') && (digits.length === 2 || digits.length === 5 || digits.length === 8)
  if (digits.length <= 2) return digits + (trailingSpace ? ' ' : '')
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}${trailingSpace ? ' ' : ''}`
  if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}${trailingSpace ? ' ' : ''}`
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
}
