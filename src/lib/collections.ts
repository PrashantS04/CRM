/** Counts items per key, preserving first-seen order: `[["Alex", 3], ["Sarah", 2]]`. */
export function countBy<T>(items: readonly T[], getKey: (item: T) => string): [string, number][] {
  const counts = new Map<string, number>()
  for (const item of items) {
    const key = getKey(item)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts]
}

/** Distinct values, sorted — handy for building filter options from rows. */
export function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}
