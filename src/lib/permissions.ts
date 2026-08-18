import type { AuthUser } from '../contexts/AuthContext'

/** Mirrors the backend check in ContentController::assertOwnerOrAdmin() — admins
 * can mutate anything, editors only their own uploads (matched by uploader email). */
function isOwnerOrAdmin(user: AuthUser | null, ownerId: string | null): boolean {
  if (!user) return false
  if (user.roles.includes('ROLE_GROUP_ADMIN')) return true
  return ownerId === user.email
}

export const canDeleteContent = isOwnerOrAdmin
export const canEditContent = isOwnerOrAdmin

/** Users can view/edit their own record; admins can view/edit any user's record.
 * Matched by id, not email — a user's own email is itself an editable field. */
function isSelfOrAdmin(user: AuthUser | null, targetUserId: string | null): boolean {
  if (!user) return false
  if (user.roles.includes('ROLE_GROUP_ADMIN')) return true
  return targetUserId === user.id
}

export const canViewUser = isSelfOrAdmin
export const canEditUser = isSelfOrAdmin
