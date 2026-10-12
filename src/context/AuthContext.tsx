import React, { createContext, useContext, useEffect, useState } from 'react'
import { onIdTokenChanged, User } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { apiClient } from '../lib/api'
import type { AppUser } from '../types'

interface AuthContextValue {
  firebaseUser: User | null
  appUser: AppUser | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({ firebaseUser: null, appUser: null, loading: true, refreshUser: async () => {} })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAppUser = async () => {
    try {
      const { data } = await apiClient.get<AppUser>('/v1/users/me')
      setAppUser(data)
    } catch {
      setAppUser(null)
    }
  }

  const refreshUser = async () => {
    await fetchAppUser()
  }

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (user) {
        await fetchAppUser()
      } else {
        setAppUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
