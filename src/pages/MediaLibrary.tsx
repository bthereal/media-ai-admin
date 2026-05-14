import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { fetchContentList, getThumbnailUrl } from '../services/contentApi'
import type { ContentDto, ContentListDto } from '../types/content-api.d.ts'
import './MediaLibrary.css'

export default function MediaLibrary() {
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

  return (
    <div className="media-library">
      <h1>Media Library</h1>

      {loading && <p className="media-loading">Loading…</p>}

      {error && !loading && (
        <p className="media-error">Failed to load media. Is the API running?</p>
      )}

      {!loading && !error && result && (
        <>
          {result.items.length === 0 ? (
            <p className="media-empty">No videos uploaded yet. <Link to="/uploads">Upload one?</Link></p>
          ) : (
            <div className="media-grid">
              {result.items.map(item => <MediaCard key={item.id} item={item} />)}
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

function MediaCard({ item }: { item: ContentDto }) {
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
