import type { ContentDto, ContentListDto, ContentResponse } from '../types/content-api.d.ts'

const CONTENT_BASE = (import.meta.env.VITE_CONTENT_ENDPOINT as string | undefined) ?? 'http://127.0.0.1:8000/api/content'
const TOKEN_KEY = 'content_admin_token'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchContent(id: string): Promise<ContentDto | null> {
  try {
    const res = await fetch(`${CONTENT_BASE}/${id}`, { headers: authHeaders() })
    if (!res.ok) return null
    const data = (await res.json()) as ContentResponse
    return data.ok ? data : null
  } catch {
    return null
  }
}

export async function fetchContentList(page: number = 1): Promise<ContentListDto | null> {
  try {
    const res = await fetch(`${CONTENT_BASE}?page=${page}`, { headers: authHeaders() })
    if (!res.ok) return null
    const data = (await res.json()) as ContentListDto
    return data.ok ? data : null
  } catch {
    return null
  }
}

export async function updateContentTitle(id: string, title: string | null): Promise<ContentDto | null> {
  try {
    const res = await fetch(`${CONTENT_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ title }),
    })
    if (!res.ok) return null
    return (await res.json()) as ContentDto
  } catch {
    return null
  }
}

/** Returns the URL to stream the raw MP4 — suitable for use as <video src> */
export function getStreamUrl(id: string): string {
  return `${CONTENT_BASE}/${id}/stream`
}

/** Returns the URL for the JPEG thumbnail (public endpoint, no auth needed) */
export function getThumbnailUrl(id: string): string {
  return `${CONTENT_BASE}/${id}/thumbnail`
}
