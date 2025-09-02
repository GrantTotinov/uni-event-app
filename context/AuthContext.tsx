import React, { createContext, useState, ReactNode, useMemo } from 'react'

export interface User {
  id?: number
  name: string
  email: string
  image: string
  role?: string
  contact_email?: string
  contact_phone?: string
  uid: string
}

export interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  getUserUid: () => string | null
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  getUserUid: () => null,
})

export function isSystemAdmin(role?: string): boolean {
  return role === 'systemadmin'
}

// Helper hook to check if user has a specific role
export function hasRole(role: string, userRole?: string): boolean {
  return userRole === role
}

interface AuthContextProviderProps {
  children: ReactNode
}

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [user, setUser] = useState<User | null>(null)

  // Calculate derived values once and memoize them
  const contextValue = useMemo(() => {
    const isAuthenticated = !!user

    // Function to get uid safely
    const getUserUid = (): string | null => {
      return user?.uid || null
    }

    return {
      user,
      setUser,
      isAuthenticated,
      getUserUid,
    }
  }, [user])

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}
