import { createContext } from "react"

export const AuthContext = createContext<any>(undefined)

export function isAdmin(userRole: string | undefined): boolean {
  if (!userRole) return false
  return userRole.toLowerCase() === "admin"
}
