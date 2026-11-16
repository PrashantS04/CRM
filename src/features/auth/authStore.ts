import { useSyncExternalStore } from 'react'

export interface AuthUser {
  username: string
  email: string
  name: string
}

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

interface AuthState {
  status: AuthStatus
  user: AuthUser | null
}

let state: AuthState = { status: 'checking', user: null }
const listeners = new Set<() => void>()

const setState = (next: AuthState) => {
  state = next
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getState = () => state

/** Marks the current Cognito session as authenticated. */
export const setAuthenticated = (user: AuthUser | null) => {
  setState({ status: 'authenticated', user })
}

export const setAnonymous = () => {
  setState({ status: 'anonymous', user: null })
}

export const setAuthChecking = () => {
  setState({ status: 'checking', user: null })
}

/** Auth status + current user claims for the signed-in Cognito session. */
export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, getState, getState)
}
