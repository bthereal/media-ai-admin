import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { fetchContent, getStreamUrl } from '../services/contentApi'
import type { ContentDto, TranscriptionDto } from '../types/content-api.d.ts'
import './ContentDetail.css'

const POLL_INTERVAL_MS = 3000

export default function ContentDetail() {
  const { id } = useParams<{ id: string }>()
  const [content, setContent] = useState<ContentDto | null>(null)
  const [notFound, setNotFound] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function poll() {
      const data = await fetchContent(id!)
      if (cancelled) return
      if (data === null) {
        setNotFound(true)
        return
      }
      setContent(data)
      const done = data.transcription?.status === 'completed' || data.transcription?.status === 'failed'
      if (done && timerRef.current != null) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    void poll()
    timerRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      if (timerRef.current != null) clearInterval(timerRef.current)
    }
  }, [id])

  if (notFound) {
    return (
      <div className="content-detail">
        <Link to="/media" className="back-link">← Media Library</Link>
        <p className="detail-not-found">Video not found.</p>
      </div>
    )
  }

  const streamUrl = id ? getStreamUrl(id) : ''

  return (
    <div className="content-detail">
      <Link to="/media" className="back-link">← Media Library</Link>

      <div className="detail-header">
        <h1 className="detail-title">{content?.filename ?? 'Loading…'}</h1>
        {content && (
          <span className="detail-meta">
            {formatBytes(content.fileSize)}
            {content.duration != null && ` · ${formatDuration(content.duration)}`}
          </span>
        )}
      </div>

      <video
        key={streamUrl}
        src={streamUrl}
        controls
        className="detail-video"
        preload="metadata"
      />

      <TranscriptionPanel transcription={content?.transcription ?? null} />
    </div>
  )
}

function TranscriptionPanel({ transcription }: { transcription: TranscriptionDto | null }) {
  if (transcription == null) {
    return (
      <div className="transcription-panel transcription-loading">
        <Spinner /> Waiting for transcription…
      </div>
    )
  }

  if (transcription.status === 'pending' || transcription.status === 'processing') {
    return (
      <div className="transcription-panel transcription-loading">
        <Spinner /> Transcribing audio…
      </div>
    )
  }

  if (transcription.status === 'failed') {
    return (
      <div className="transcription-panel transcription-error">
        Transcription failed. The video has been saved but no transcript is available.
      </div>
    )
  }

  return (
    <div className="transcription-panel transcription-complete">
      <h3 className="transcription-label">Transcript</h3>
      <p className="transcription-text">{transcription.text}</p>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
    </svg>
  )
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
