import { useCallback, useState } from 'react'

/**
 * useState that survives reloads via localStorage. Storage can be blocked
 * (private mode), so every access is guarded and falls back to in-memory state.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored === null ? initial : (JSON.parse(stored) as T)
    } catch {
      return initial
    }
  })

  const update = useCallback(
    (next: T) => {
      setValue(next)
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch {
        /* storage unavailable: keep the in-memory value */
      }
    },
    [key],
  )

  return [value, update] as const
}
