import type { ContentDto } from './content-api.d.ts'

/** A playlist in the current user's own list — GET /api/playlists */
export interface PlaylistDto {
  id: string
  title: string
  visibility: 'private' | 'public'
  itemCount: number
  createdAt: string
}

export interface PlaylistListDto {
  ok: true
  items: PlaylistDto[]
}

/** One ordered entry in a playlist, with the full content record */
export interface PlaylistItemDto {
  id: string
  position: number
  content: ContentDto
}

/** A playlist with its ordered items — GET/POST/PATCH /api/playlists/{id} */
export interface PlaylistDetailDto {
  ok: true
  id: string
  title: string
  visibility: 'private' | 'public'
  createdAt: string
  items: PlaylistItemDto[]
}
