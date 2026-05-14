import type { ContentDto, ContentListDto, ContentResponse } from '../types/content-api.d.ts'

const CONTENT_BASE = (import.meta.env.VITE_CONTENT_ENDPOINT as string | undefined) ?? 'http://127.0.0.1:8000/api/content'

export async function fetchContent(id: string): Promise<ContentDto | null> {
  try {
    const res = await fetch(`${CONTENT_BASE}/${id}`)
    if (!res.ok) return null
    const data = (await res.json()) as ContentResponse
    return data.ok ? data : null
  } catch {
    return null
  }
}

export async function fetchContentList(page: number = 1): Promise<ContentListDto | null> {
  try {
    const res = await fetch(`${CONTENT_BASE}?page=${page}`)
    if (!res.ok) return null
    const data = (await res.json()) as ContentListDto
    return data.ok ? data : null
  } catch {
    return null
  }
}

/** Returns the URL to stream the raw MP4 — suitable for use as <video src> */
export function getStreamUrl(id: string): string {
  return `${CONTENT_BASE}/${id}/stream`
}
