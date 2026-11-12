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
