// Single source for role badges (was copy-pasted in 4 components).
const ROLES = {
  systemadmin: { label: 'Системен Админ', color: '#dc3545', icon: 'shield-crown' },
  teacher: { label: 'Преподавател', color: '#007bff', icon: 'school' },
  student: { label: 'Студент', color: '#9e9e9e', icon: 'account' },
} as const

const meta = (role?: string | null) =>
  ROLES[role as keyof typeof ROLES] ?? ROLES.student

export const roleLabel = (role?: string | null): string => meta(role).label

/** `fallback` replaces the neutral student gray (e.g. a theme color). */
export const roleColor = (role?: string | null, fallback?: string): string => {
  const m = meta(role)
  return m === ROLES.student && fallback ? fallback : m.color
}

export const roleIcon = (role?: string | null): string => meta(role).icon
