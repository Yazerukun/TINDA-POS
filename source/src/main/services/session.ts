import type { SessionUser } from '@shared/types'
import { hasPermission, type Permission } from '@shared/roles'

let session: SessionUser | null = null

export function getSession(): SessionUser | null {
  return session
}

export function setSession(user: SessionUser | null): void {
  session = user
}

export function requireUser(): SessionUser {
  if (!session) throw new Error('Not authenticated.')
  return session
}

export function currentCan(permission: Permission): boolean {
  if (!session) return false
  return hasPermission(session.roles, permission)
}

export function requirePermission(permission: Permission): SessionUser {
  const u = requireUser()
  if (!hasPermission(u.roles, permission)) {
    throw new Error('You do not have permission for this action.')
  }
  return u
}