import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { deleteContent, fetchContentList, getThumbnailUrl } from '../services/contentApi'
import type { ContentDto, ContentListDto } from '../types/content-api.d.ts'
import './MediaLibrary.css'

export default function MediaLibrary() {
  const navigate = useNavigate()
  const [result, setResult] = useState<ContentListDto | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetchContentList(page).then(data => {
      if (cancelled) return
      if (data) {
        setResult(data)
      } else {
        setError(true)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [page])

  function handleDelete(id: string) {
    setResult(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== id) } : prev)
  }

  return (
    <div className="media-library">
      <div className="media-library-header">
        <h1>Media Library</h1>
        <button type="button" className="btn-upload" onClick={() => void navigate('/uploads')}>
          Upload
        </button>
      </div>

      {loading && <p className="media-loading">Loading…</p>}

      {error && !loading && (
        <p className="media-error">Failed to load media. Is the API running?</p>
      )}

      {!loading && !error && result && (
        <>
          {result.items.length === 0 ? (
            <p className="media-empty">No videos uploaded yet.</p>
          ) : (
            <div className="media-grid">
              {result.items.map(item => (
                <MediaCard key={item.id} item={item} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {result.totalPages > 1 && (
            <div className="media-pagination">
              <button
                className="btn-ghost"
                onClick={() => setPage(p => p - 1)}
                disabled={!result.hasPrev}
              >
                ← Previous
              </button>
              <span className="media-page-info">
                Page {result.page} of {result.totalPages}
              </span>
              <button
                className="btn-ghost"
                onClick={() => setPage(p => p + 1)}
                disabled={!result.hasNext}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MediaCard({ item, onDelete }: { item: ContentDto; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDeleting(true)
    const ok = await deleteContent(item.id)
    if (ok) {
      onDelete(item.id)
    } else {
      setDeleting(false)
    }
  }

  return (
    <Link to={`/media/${item.id}`} className="media-card">
      <div className="media-card-thumb">
        {item.hasThumbnail ? (
          <img src={getThumbnailUrl(item.id)} alt={item.filename} className="media-card-thumb-img" loading="lazy" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" />
          </svg>
        )}
        <button
          className="media-card-delete"
          onClick={e => void handleDelete(e)}
          disabled={deleting}
          aria-label="Archive video"
          title="Archive"
        >
          {deleting ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className="media-card-delete-spinner">
              <circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          )}
        </button>
      </div>
      <div className="media-card-body">
        <p className="media-card-name" title={item.title ?? item.filename}>{item.title ?? item.filename}</p>
        <p className="media-card-meta">
          {formatBytes(item.fileSize)}
          {item.duration != null && ` · ${formatDuration(item.duration)}`}
        </p>
        <TranscriptionBadge status={item.transcription?.status ?? null} />
      </div>
    </Link>
  )
}

function TranscriptionBadge({ status }: { status: string | null }) {
  if (status === 'completed') {
    return <span className="badge badge-success">Transcribed</span>
  }
  if (status === 'failed') {
    return <span className="badge badge-error">Transcription failed</span>
  }
  if (status === 'processing' || status === 'pending') {
    return <span className="badge badge-pending">Transcribing…</span>
  }
  return <span className="badge badge-pending">Pending</span>
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
