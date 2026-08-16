import { authFetch, UnauthorizedError } from '../lib/authFetch'
import type { ContentDto, ContentListDto, ContentResponse, RelatedVideosDto } from '../types/content-api.d.ts'

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

export async function fetchContentList(page: number = 1, category?: string | null): Promise<ContentListDto | null> {
  try {
    const params = new URLSearchParams({ page: String(page) })
    if (category) params.set('category', category)
    const res = await authFetch(`${CONTENT_BASE}?${params.toString()}`)
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

export async function generateSummary(id: string): Promise<ContentDto | null> {
  try {
    const res = await authFetch(`${CONTENT_BASE}/${id}/summarize`, { method: 'POST' })
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

export async function fetchRelatedVideos(id: string): Promise<ContentDto[] | null> {
  try {
    const res = await authFetch(`${CONTENT_BASE}/${id}/related`)
    if (!res.ok) return null
    const data = (await res.json()) as RelatedVideosDto
    return data.ok ? data.items : null
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export function getStreamUrl(id: string): string {
  return `${CONTENT_BASE}/${id}/stream`
}

export function getThumbnailUrl(id: string, cacheBust?: number): string {
  const base = `${CONTENT_BASE}/${id}/thumbnail`
  return cacheBust != null ? `${base}?v=${cacheBust}` : base
}

export function getCaptionsUrl(id: string, langCode: string): string {
  return `${CONTENT_BASE}/${id}/captions/${langCode}.vtt`
}

export async function regenerateThumbnail(id: string): Promise<ContentDto | null> {
  try {
    const res = await authFetch(`${CONTENT_BASE}/${id}/thumbnail`, { method: 'POST' })
    if (!res.ok) return null
    return (await res.json()) as ContentDto
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export interface SearchVideoResult {
  id: string
  title: string | null
  summary: string | null
}

export interface SearchResult {
  answer: string
  videos: SearchVideoResult[]
}

export async function searchContent(query: string): Promise<SearchResult | null> {
  try {
    const res = await authFetch(`${CONTENT_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { ok: boolean; answer?: string; videos?: SearchVideoResult[] }
    return data.ok && data.answer ? { answer: data.answer, videos: data.videos ?? [] } : null
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}
