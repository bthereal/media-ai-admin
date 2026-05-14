import { PASSPORT_BASE } from '../contexts/AuthContext'

export interface CreateUserPayload {
  email: string
  password: string
  firstName: string
  lastName: string
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
    const res = await fetch(`${PASSPORT_BASE}/api/user`, {
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
        firstName: data.firstName as string,
        lastName: data.lastName as string,
      }
    }

    if (res.status === 422 && data.errors) {
      return { ok: false, error: 'Validation failed.', errors: data.errors as Record<string, string> }
    }

    return { ok: false, error: (data.message as string | undefined) ?? 'Failed to create user.' }
  } catch {
    return { ok: false, error: 'Unable to connect to auth server.' }
  }
}
