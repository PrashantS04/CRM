export type ExportFormat = 'csv' | 'xls' | 'pdf'

const MIME: Record<Exclude<ExportFormat, 'pdf'>, string> = {
  csv: 'text/csv;charset=utf-8',
  xls: 'application/vnd.ms-excel',
}

function escapeCell(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

export function toCsv(rows: readonly Record<string, unknown>[]): string {
  const first = rows[0]
  if (!first) return ''
  const keys = Object.keys(first)
  return [
    keys.join(','),
    ...rows.map((row) => keys.map((key) => escapeCell(row[key])).join(',')),
  ].join('\n')
}

/** Downloads rows as CSV or XLS. PDF export needs a server renderer and is not handled here. */
export function downloadRows(
  filename: string,
  rows: readonly Record<string, unknown>[],
  format: Exclude<ExportFormat, 'pdf'>,
): void {
  const blob = new Blob([toCsv(rows)], { type: MIME[format] })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.${format}`
  link.click()
  URL.revokeObjectURL(url)
}
