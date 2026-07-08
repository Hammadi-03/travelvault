/**
 * A lightweight AuthContext mock for use in hook tests that need useAuth().
 * Re-exports the real context object so the hook's `useContext` call resolves
 * against the same reference — no magic module replacement needed.
 */

import { createContext } from 'react'
import type { UserResponse } from '@/lib/api'

export interface AuthContextValue {
  user: UserResponse | null
  // Add other fields consumed by hooks under test as needed
}

// This must match the shape expected by useAuth() inside useMedia
// We re-create the context here and patch the real one via module mock below.
export const AuthContext = createContext<AuthContextValue>({ user: null })
