import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { addPlaylistItem, createPlaylist, fetchPlaylists } from '../../services/playlistsApi'
import type { PlaylistDto } from '../../types/playlist-api.d.ts'
import './AddToPlaylistMenu.css'

interface Position {
  top: number
  right: number
}

export default function AddToPlaylistMenu({ contentId, label }: { contentId: string; label?: string }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)
  const [playlists, setPlaylists] = useState<PlaylistDto[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  function computePosition(): Position | null {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { top: rect.bottom + 4, right: window.innerWidth - rect.right }
  }

  // Positioned via a portal to document.body (see computePosition) rather than
  // relative to the trigger, because both `.media-card` and `.media-card-thumb`
  // use `overflow: hidden` for rounded corners / thumbnail cropping — a
  // normally-positioned dropdown would be clipped by those ancestors regardless
  // of z-index.
  useEffect(() => {
    if (!open) return

    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }

    function onReposition() {
      setPosition(computePosition())
    }

    document.addEventListener('mousedown', onClickOutside)
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [open])

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const next = !open
    setPosition(next ? computePosition() : null)
    setOpen(next)
    if (next && playlists === null) {
      setLoading(true)
      const data = await fetchPlaylists()
      setLoading(false)
      setPlaylists(data ?? [])
    }
  }

  async function handleAdd(e: React.MouseEvent, playlistId: string) {
    e.preventDefault()
    e.stopPropagation()
    const updated = await addPlaylistItem(playlistId, contentId)
    if (updated) {
      setAddedTo(prev => new Set(prev).add(playlistId))
    }
  }

  async function handleCreateAndAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const title = newTitle.trim()
    if (!title) return
    const created = await createPlaylist(title)
    if (!created) return
    const updated = await addPlaylistItem(created.id, contentId)
    if (updated) {
      setPlaylists(prev => [
        { id: created.id, title: created.title, visibility: created.visibility, itemCount: 1, createdAt: created.createdAt },
        ...(prev ?? []),
      ])
      setAddedTo(prev => new Set(prev).add(created.id))
      setNewTitle('')
      setCreating(false)
    }
  }

  return (
    <div className="add-to-playlist">
      <button
        ref={triggerRef}
        type="button"
        className="add-to-playlist-trigger"
        onClick={e => void handleToggle(e)}
        aria-label="Add to playlist"
        title="Add to playlist"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {label && <span>{label}</span>}
      </button>

      {open && position && createPortal(
        <div
          ref={panelRef}
          className="add-to-playlist-panel"
          style={{ top: position.top, right: position.right }}
          onClick={e => e.stopPropagation()}
        >
          {loading && <p className="add-to-playlist-loading">Loading…</p>}

          {!loading && playlists && playlists.length === 0 && !creating && (
            <p className="add-to-playlist-empty">No playlists yet.</p>
          )}

          {!loading && playlists?.map(p => (
            <button
              key={p.id}
              type="button"
              className="add-to-playlist-option"
              onClick={e => void handleAdd(e, p.id)}
              disabled={addedTo.has(p.id)}
            >
              {addedTo.has(p.id) ? `${p.title} ✓` : p.title}
            </button>
          ))}

          {creating ? (
            <div className="add-to-playlist-new-row">
              <input
                className="form-input"
                type="text"
                maxLength={255}
                placeholder="New playlist title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                autoFocus
              />
              <button type="button" onClick={e => void handleCreateAndAdd(e)} disabled={!newTitle.trim()}>
                Add
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="add-to-playlist-new-btn"
              onClick={e => { e.preventDefault(); e.stopPropagation(); setCreating(true) }}
            >
              + New playlist
            </button>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
