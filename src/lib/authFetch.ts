export const TOKEN_KEY = 'content_admin_token'

export class UnauthorizedError extends Error {
  constructor() {
    super('Session expired')
    this.name = 'UnauthorizedError'
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.headers as Record<string, string> | undefined) },
  })
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    window.location.replace('/login')
    throw new UnauthorizedError()
  }
  return res
}
