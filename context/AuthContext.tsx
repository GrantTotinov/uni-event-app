import { createContext } from "react"

export const AuthContext = createContext<any>(undefined)

export function isAdmin(userRole: string | undefined): boolean {
  return userRole === "admin"
}
