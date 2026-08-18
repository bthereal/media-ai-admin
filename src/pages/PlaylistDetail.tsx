import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import ChapterRail from '../components/ChapterRail/ChapterRail'
import { usePlaybackTracking } from '../hooks/usePlaybackTracking'
import { getCaptionTracks } from '../lib/captionTracks'
import { deletePlaylist, fetchPlaylist, removePlaylistItem, reorderPlaylistItems, updatePlaylist } from '../services/playlistsApi'
import { getCaptionsUrl, getStreamUrl, getThumbnailUrl } from '../services/contentApi'
import type { PlaylistDetailDto } from '../types/playlist-api.d.ts'
import './PlaylistDetail.css'

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [playlist, setPlaylist] = useState<PlaylistDetailDto | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [titleInput, setTitleInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const titleInitialized = useRef(false)

  const currentItem = playlist?.items[currentIndex] ?? null
  usePlaybackTracking(currentItem?.content.id, videoRef)
  const captionTracks = getCaptionTracks(currentItem?.content.transcription?.captions)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetchPlaylist(id).then(data => {
      if (cancelled) return
      if (data === null) { setNotFound(true); return }
      setPlaylist(data)
    })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (playlist && !titleInitialized.current) {
      setTitleInput(playlist.title)
      titleInitialized.current = true
    }
  }, [playlist])

  function handleEnded() {
    if (!playlist) return
    setCurrentIndex(i => (i + 1 < playlist.items.length ? i + 1 : i))
  }

  function handleChapterClick(startSeconds: number) {
    const video = videoRef.current
    if (!video) return
    const apply = () => {
      video.currentTime = startSeconds
      void video.play()
    }
    if (video.readyState >= 1) {
      apply()
    } else {
      video.addEventListener('loadedmetadata', apply, { once: true })
    }
  }

  async function handleSaveTitle() {
    if (!id || !playlist) return
    const title = titleInput.trim()
    if (!title || title === playlist.title) return
    setSaving(true)
    const updated = await updatePlaylist(id, { title })
    setSaving(false)
    if (updated) setPlaylist(updated)
  }

  async function handleRemove(itemId: string) {
    if (!id || !playlist) return
    const removedIndex = playlist.items.findIndex(i => i.id === itemId)
    const updated = await removePlaylistItem(id, itemId)
    if (updated) {
      setPlaylist(updated)
      if (removedIndex !== -1 && removedIndex <= currentIndex) {
        setCurrentIndex(i => Math.max(0, i - 1))
      }
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!id || !playlist) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= playlist.items.length) return

    const ids = playlist.items.map(i => i.id)
    const tmp = ids[index]
    ids[index] = ids[targetIndex]
    ids[targetIndex] = tmp

    const updated = await reorderPlaylistItems(id, ids)
    if (updated) {
      setPlaylist(updated)
      if (currentIndex === index) setCurrentIndex(targetIndex)
      else if (currentIndex === targetIndex) setCurrentIndex(index)
    }
  }

  async function handleDeletePlaylist() {
    if (!id) return
    setDeleting(true)
    const ok = await deletePlaylist(id)
    setDeleting(false)
    if (ok) void navigate('/playlists', { replace: true })
  }

  if (notFound) {
    return (
      <div className="playlist-detail">
        <Link to="/playlists" className="back-link">← My Playlists</Link>
        <p className="detail-not-found">Playlist not found.</p>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="playlist-detail">
        <Link to="/playlists" className="back-link">← My Playlists</Link>
        <p className="playlists-loading">Loading…</p>
      </div>
    )
  }

  const streamUrl = currentItem ? getStreamUrl(currentItem.content.id) : ''

  return (
    <div className="playlist-detail">
      <Link to="/playlists" className="back-link">← My Playlists</Link>

      <div className="playlist-detail-header">
        <input
          className="playlist-title-input"
          value={titleInput}
          maxLength={255}
          onChange={e => setTitleInput(e.target.value)}
          onBlur={() => void handleSaveTitle()}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        />
        {saving && <span className="playlist-title-saving">Saving…</span>}
        <button type="button" className="btn-delete" onClick={() => void handleDeletePlaylist()} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete playlist'}
        </button>
      </div>

      {currentItem ? (
        <video
          key={streamUrl}
          ref={videoRef}
          src={streamUrl}
          controls
          autoPlay
          className="detail-video"
          onEnded={handleEnded}
        >
          {captionTracks.map(track => (
            <track
              key={track.code}
              kind="subtitles"
              src={getCaptionsUrl(currentItem.content.id, track.code)}
              srcLang={track.code}
              label={track.label}
            />
          ))}
        </video>
      ) : (
        <div className="playlist-empty-player">Add videos to this playlist to start watching.</div>
      )}

      {currentItem?.content.transcription?.chapters != null && currentItem.content.transcription.chapters.length > 0 && (
        <ChapterRail chapters={currentItem.content.transcription.chapters} onSelect={handleChapterClick} />
      )}

      <ol className="playlist-item-list">
        {playlist.items.map((item, index) => (
          <li key={item.id} className={`playlist-item${index === currentIndex ? ' playlist-item-active' : ''}`}>
            <button type="button" className="playlist-item-play" onClick={() => setCurrentIndex(index)}>
              {item.content.hasThumbnail ? (
                <img src={getThumbnailUrl(item.content.id)} alt="" className="playlist-item-thumb" />
              ) : (
                <div className="playlist-item-thumb playlist-item-thumb-empty" />
              )}
              <span className="playlist-item-title">{item.content.title ?? item.content.filename}</span>
            </button>
            <div className="playlist-item-actions">
              <button type="button" onClick={() => void handleMove(index, -1)} disabled={index === 0} aria-label="Move up" title="Move up">↑</button>
              <button type="button" onClick={() => void handleMove(index, 1)} disabled={index === playlist.items.length - 1} aria-label="Move down" title="Move down">↓</button>
              <button type="button" onClick={() => void handleRemove(item.id)} aria-label="Remove from playlist" title="Remove">✕</button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
