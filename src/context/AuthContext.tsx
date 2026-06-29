import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi, profileApi, getToken, clearToken } from '@/lib/api'
import type { UserResponse } from '@/lib/api'

export type Profile = UserResponse

interface AuthContextType {
  user: Profile | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session from stored token on mount
  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    authApi.me()
      .then(setUser)
      .catch(() => { clearToken(); setUser(null) })
      .finally(() => setLoading(false))
  }, [])

  const signIn = async (email: string, password: string) => {
    const u = await authApi.login(email, password)
    setUser(u)
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    const u = await authApi.register(email, password, displayName)
    setUser(u)
  }

  const signOut = async () => {
    await authApi.logout()
    setUser(null)
  }

  const resetPassword = async (email: string) => {
    await authApi.forgotPassword(email)
  }

  const refreshProfile = async () => {
    const u = await authApi.me()
    setUser(u)
  }

  const updateProfile = async (
    updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>,
  ) => {
    const updated = await profileApi.update(updates)
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{
      user, profile: user, loading,
      signIn, signUp, signOut, resetPassword, updateProfile, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
