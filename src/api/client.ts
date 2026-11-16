import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ApiError, type ApiErrorCode } from './http'

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Set to true to skip the global 401 handler for this request. */
    skipAuthLogout?: boolean
  }
}

/**
 * Shared axios instance for the Spring Boot backend.
 *
 * Mirrors LMS-Frontend's `services/api.js`: every request carries an
 * `X-Request-Id` and `X-User-Agent`, a Bearer token is attached when a token
 * provider has been registered (auth lands later), and 401s can trigger a
 * session-expired handler. In development `baseURL` is `/api`, which Vite
 * proxies to http://localhost:8080 (see vite.config.ts).
 */

export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const createRequestId = () => crypto.randomUUID()

/** Repeat format (`?a=1&a=2`) so Spring binds `List`/`String[]` params. */
const serializeParams = (params: Record<string, unknown>) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue
    for (const item of Array.isArray(value) ? value : [value]) {
      search.append(key, String(item))
    }
  }
  return search.toString()
}

type TokenProvider = () => string | null | undefined | Promise<string | null | undefined>

let tokenProvider: TokenProvider = () => null
let unauthorizedHandler: (() => void) | null = null

/** Register where access tokens come from (e.g. the auth session once it exists). */
export function setTokenProvider(provider: TokenProvider) {
  tokenProvider = provider
}

/** Called on 401 responses (unless a request sets `skipAuthLogout`). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  paramsSerializer: { serialize: serializeParams },
})

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenProvider()
  const headers = config.headers

  if (token && !headers.get('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  headers.set('X-Request-Id', createRequestId())

  // Custom User-Agent detection (e.g. Brave)
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    let ua = navigator.userAgent
    if ('brave' in navigator) {
      ua = ua.replace('Chrome/', 'Brave/')
    }
    headers.set('X-User-Agent', ua)
  }

  return config
})

const API_ERROR_CODES: ApiErrorCode[] = [
  'NOT_FOUND',
  'DUPLICATE_ACN',
  'DUPLICATE_ABN',
  'INVALID_STAGE',
  'VALIDATION',
]

/** Normalises an axios failure into the app's ApiError shape when the backend sends a code. */
export function toApiError(error: unknown): ApiError | null {
  if (!axios.isAxiosError(error)) return null
  const data = error.response?.data as
    | { code?: string; message?: string; field?: string }
    | undefined
  const code = API_ERROR_CODES.find((c) => c === data?.code)
  if (!code) return null
  return new ApiError(code, data?.message ?? error.message, data?.field)
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const apiError = toApiError(error)
    const data = error.response?.data as { message?: string } | undefined
    console.error('API Error:', {
      status: error.response?.status,
      message: apiError?.message ?? data?.message,
      url: error.config?.url,
    })

    if (error.response?.status === 401 && !error.config?.skipAuthLogout) {
      unauthorizedHandler?.()
    }

    return Promise.reject(apiError ?? error)
  },
)

export default api
