/**
 * HTTP client for the CRM backend. Requests go to /api on the same origin (the Vite dev server proxies them to
 * Spring Boot; production serves both from one host).
 *
 * Sign-in: until Cognito / Microsoft 365 sign-in is wired, development runs as a seeded dev user sent in the
 * X-Dev-User header (the backend accepts it only with crm.auth.dev-users=true). The dev user can be switched in the
 * top bar and is remembered in this browser.
 */

const DEV_USER_KEY = 'crm.devUser'
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export function devUser(): string {
  try {
    return localStorage.getItem(DEV_USER_KEY) || import.meta.env.VITE_DEV_USER || 'u1'
  } catch {
    return import.meta.env.VITE_DEV_USER || 'u1'
  }
}

export function setDevUser(id: string) {
  try {
    localStorage.setItem(DEV_USER_KEY, id)
  } catch {
    // Storage blocked: the choice lasts until reload.
  }
}

/** An error response from the API. `code` is the backend's stable error code (validation, stale, duplicate-warning...). */
export class CrmApiError extends Error {
  status: number
  code: string
  errors: Record<string, string>
  body: Record<string, unknown>

  constructor(status: number, body: Record<string, unknown>) {
    super((body.detail as string) || `Request failed (${status})`)
    this.name = 'CrmApiError'
    this.status = status
    this.code = (body.code as string) || (status === 0 ? 'network' : 'error')
    this.errors = (body.errors as Record<string, string>) || {}
    this.body = body
  }
}

/**
 * Calls the API. `version` is the record version the screen loaded, sent as If-Match so a stale screen can't
 * overwrite a newer save (the backend answers 409 "stale").
 */
export async function request<T>(method: string, path: string, body?: unknown, version?: number): Promise<T> {
  const headers: Record<string, string> = { 'X-Dev-User': devUser(), Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (version !== undefined) headers['If-Match'] = `"${version}"`
  const url = API_BASE ? `${API_BASE}${path.startsWith('/') ? path : `/${path}`}` : path
  let res: Response
  try {
    res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new CrmApiError(0, { detail: "Can't reach the CRM server. Check your connection and try again." })
  }
  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : undefined
  } catch {
    data = { detail: text }
  }
  if (!res.ok) throw new CrmApiError(res.status, (data as Record<string, unknown>) ?? {})
  return data as T
}

/** The first message of an error, for a toast or a banner. */
export function errorMessage(e: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (e instanceof CrmApiError) return Object.values(e.errors)[0] ?? e.message
  return fallback
}
