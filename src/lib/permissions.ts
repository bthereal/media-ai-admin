import type { AuthUser } from '../contexts/AuthContext'

/** Mirrors the backend check in ContentController::delete() — admins can delete
 * anything, editors only their own uploads (matched by uploader email). */
export function canDeleteContent(user: AuthUser | null, ownerId: string | null): boolean {
  if (!user) return false
  if (user.roles.includes('ROLE_GROUP_ADMIN')) return true
  return ownerId === user.email
}
