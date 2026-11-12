export type ApiErrorCode =
  'NOT_FOUND' | 'DUPLICATE_ACN' | 'DUPLICATE_ABN' | 'INVALID_STAGE' | 'VALIDATION'

/** Typed error so forms can map failures (e.g. hard gate G1) to a field. */
export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly field?: string

  constructor(code: ApiErrorCode, message: string, field?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.field = field
  }
}

const LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 120

/** Simulates a network round trip. Remove when the real client lands. */
export function respond<T>(value: T): Promise<T> {
  const copy = structuredClone(value)
  return new Promise((resolve) => setTimeout(() => resolve(copy), LATENCY_MS))
}

export function notFound(what: string, id: string): never {
  throw new ApiError('NOT_FOUND', `${what} ${id} was not found`)
}
