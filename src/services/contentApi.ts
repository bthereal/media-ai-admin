import { authFetch, UnauthorizedError } from '../lib/authFetch'
import type { ContentDto, ContentListDto, ContentResponse } from '../types/content-api.d.ts'

const CONTENT_BASE = (import.meta.env.VITE_CONTENT_ENDPOINT as string | undefined) ?? '/api/content'

export async function fetchContent(id: string): Promise<ContentDto | null> {
  try {
    const res = await authFetch(`${CONTENT_BASE}/${id}`)
    if (!res.ok) return null
    const data = (await res.json()) as ContentResponse
    return data.ok ? data : null
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export async function fetchContentList(page: number = 1): Promise<ContentListDto | null> {
  try {
    const res = await authFetch(`${CONTENT_BASE}?page=${page}`)
    if (!res.ok) return null
    const data = (await res.json()) as ContentListDto
    return data.ok ? data : null
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export async function updateContent(
  id: string,
  patch: { title?: string | null; summary?: string | null },
): Promise<ContentDto | null> {
  try {
    const res = await authFetch(`${CONTENT_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) return null
    return (await res.json()) as ContentDto
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export async function updateContentTitle(id: string, title: string | null): Promise<ContentDto | null> {
  try {
    const res = await authFetch(`${CONTENT_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    if (!res.ok) return null
    return (await res.json()) as ContentDto
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export async function deleteContent(id: string): Promise<boolean> {
  try {
    const res = await authFetch(`${CONTENT_BASE}/${id}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

export function getStreamUrl(id: string): string {
  return `${CONTENT_BASE}/${id}/stream`
}

export function getThumbnailUrl(id: string): string {
  return `${CONTENT_BASE}/${id}/thumbnail`
}
