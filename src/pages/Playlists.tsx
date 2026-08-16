import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { createPlaylist, deletePlaylist, fetchPlaylists } from '../services/playlistsApi'
import type { PlaylistDto } from '../types/playlist-api.d.ts'
import './Playlists.css'

export default function Playlists() {
  const navigate = useNavigate()
  const [playlists, setPlaylists] = useState<PlaylistDto[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetchPlaylists().then(data => {
      if (cancelled) return
      if (data) {
        setPlaylists(data)
      } else {
        setError(true)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  async function handleCreate() {
    const title = newTitle.trim()
    if (!title) return
    setSubmitting(true)
    const created = await createPlaylist(title)
    setSubmitting(false)
    if (created) {
      void navigate(`/playlists/${created.id}`)
    }
  }

  async function handleDelete(id: string) {
    const ok = await deletePlaylist(id)
    if (ok) {
      setPlaylists(prev => prev?.filter(p => p.id !== id) ?? prev)
    }
  }

  return (
    <div className="playlists">
      <div className="playlists-header">
        <h1>My Playlists</h1>
        <button type="button" className="btn-upload" onClick={() => setCreating(o => !o)}>
          {creating ? 'Cancel' : 'New playlist'}
        </button>
      </div>

      {creating && (
        <div className="playlists-create-row">
          <input
            className="form-input"
            type="text"
            maxLength={255}
            placeholder="Playlist title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void handleCreate() }}
            autoFocus
          />
          <button type="button" className="btn-primary" onClick={() => void handleCreate()} disabled={submitting || !newTitle.trim()}>
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      )}

      {loading && <p className="playlists-loading">Loading…</p>}
      {error && !loading && <p className="playlists-error">Failed to load playlists. Is the API running?</p>}

      {!loading && !error && playlists && (
        playlists.length === 0 ? (
          <p className="playlists-empty">No playlists yet — create one to start grouping videos.</p>
        ) : (
          <div className="playlists-grid">
            {playlists.map(playlist => (
              <div key={playlist.id} className="playlist-card">
                <Link to={`/playlists/${playlist.id}`} className="playlist-card-link">
                  <p className="playlist-card-title">{playlist.title}</p>
                  <p className="playlist-card-meta">
                    {playlist.itemCount} video{playlist.itemCount === 1 ? '' : 's'}
                    {' · '}
                    <span className={`badge ${playlist.visibility === 'public' ? 'badge-success' : 'badge-pending'}`}>
                      {playlist.visibility}
                    </span>
                  </p>
                </Link>
                <button
                  type="button"
                  className="playlist-card-delete"
                  onClick={() => void handleDelete(playlist.id)}
                  aria-label="Delete playlist"
                  title="Delete playlist"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
