import { authFetch, UnauthorizedError } from '../lib/authFetch'
import type { PlaylistDetailDto, PlaylistDto, PlaylistListDto } from '../types/playlist-api.d.ts'

const PLAYLISTS_BASE = (import.meta.env.VITE_PLAYLISTS_ENDPOINT as string | undefined) ?? '/api/playlists'

export async function fetchPlaylists(): Promise<PlaylistDto[] | null> {
  try {
    const res = await authFetch(PLAYLISTS_BASE)
    if (!res.ok) return null
    const data = (await res.json()) as PlaylistListDto
    return data.ok ? data.items : null
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export async function fetchPlaylist(id: string): Promise<PlaylistDetailDto | null> {
  try {
    const res = await authFetch(`${PLAYLISTS_BASE}/${id}`)
    if (!res.ok) return null
    const data = (await res.json()) as PlaylistDetailDto
    return data.ok ? data : null
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export async function createPlaylist(title: string, visibility: 'private' | 'public' = 'private'): Promise<PlaylistDetailDto | null> {
  try {
    const res = await authFetch(PLAYLISTS_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, visibility }),
    })
    if (!res.ok) return null
    return (await res.json()) as PlaylistDetailDto
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export async function updatePlaylist(id: string, patch: { title?: string; visibility?: 'private' | 'public' }): Promise<PlaylistDetailDto | null> {
  try {
    const res = await authFetch(`${PLAYLISTS_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) return null
    return (await res.json()) as PlaylistDetailDto
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export async function deletePlaylist(id: string): Promise<boolean> {
  try {
    const res = await authFetch(`${PLAYLISTS_BASE}/${id}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

export async function addPlaylistItem(playlistId: string, contentId: string): Promise<PlaylistDetailDto | null> {
  try {
    const res = await authFetch(`${PLAYLISTS_BASE}/${playlistId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId }),
    })
    if (!res.ok) return null
    return (await res.json()) as PlaylistDetailDto
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export async function removePlaylistItem(playlistId: string, itemId: string): Promise<PlaylistDetailDto | null> {
  try {
    const res = await authFetch(`${PLAYLISTS_BASE}/${playlistId}/items/${itemId}`, { method: 'DELETE' })
    if (!res.ok) return null
    return (await res.json()) as PlaylistDetailDto
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export async function reorderPlaylistItems(playlistId: string, itemIds: string[]): Promise<PlaylistDetailDto | null> {
  try {
    const res = await authFetch(`${PLAYLISTS_BASE}/${playlistId}/items`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIds }),
    })
    if (!res.ok) return null
    return (await res.json()) as PlaylistDetailDto
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}
