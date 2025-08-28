import React, { createContext, useState, ReactNode } from 'react'

interface User {
  name: string
  email: string
  image: string
  role?: string
  contact_email?: string
  contact_phone?: string
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
})

export function isSystemAdmin(role?: string): boolean {
  return role === 'systemadmin'
}

interface AuthContextProviderProps {
  children: ReactNode
}

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [user, setUser] = useState<User | null>(null)

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}
