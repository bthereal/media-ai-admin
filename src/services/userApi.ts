import { authFetch, UnauthorizedError } from '../lib/authFetch'

export interface UserListItem {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  permissions: string[]
  deactivatedAt: string | null
  createdAt: string
}

export async function fetchUsers(): Promise<UserListItem[] | null> {
  try {
    const res = await authFetch('/api/auth/users')
    if (!res.ok) return null
    const data = await res.json() as { ok: boolean; items?: UserListItem[] }
    return data.ok ? (data.items ?? []) : null
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export async function fetchUser(id: string): Promise<UserListItem | null> {
  try {
    const res = await authFetch(`/api/auth/users/${id}`)
    if (!res.ok) return null
    return await res.json() as UserListItem
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export async function deactivateUser(id: string): Promise<UserListItem | null> {
  try {
    const res = await authFetch(`/api/auth/users/${id}/deactivate`, { method: 'POST' })
    if (!res.ok) return null
    return await res.json() as UserListItem
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export async function reactivateUser(id: string): Promise<UserListItem | null> {
  try {
    const res = await authFetch(`/api/auth/users/${id}/reactivate`, { method: 'POST' })
    if (!res.ok) return null
    return await res.json() as UserListItem
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export interface CreateUserPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
}

export interface CreateUserResult {
  ok: true
  id: string
  email: string
  firstName: string
  lastName: string
}

export interface CreateUserError {
  ok: false
  error: string
  errors?: Record<string, string>
}

export async function createUser(
  payload: CreateUserPayload,
  token: string,
): Promise<CreateUserResult | CreateUserError> {
  try {
    const res = await authFetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json() as Record<string, unknown>

    if (res.status === 201) {
      return {
        ok: true,
        id: data.id as string,
        email: data.email as string,
        firstName: data.first_name as string,
        lastName: data.last_name as string,
      }
    }

    if (res.status === 422 && data.errors) {
      return { ok: false, error: 'Validation failed.', errors: data.errors as Record<string, string> }
    }

    return { ok: false, error: (data.message as string | undefined) ?? 'Failed to create user.' }
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return { ok: false, error: 'Unable to connect to the API.' }
  }
}
