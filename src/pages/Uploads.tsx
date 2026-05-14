import { useEffect, useRef, useState } from 'react'
import VideoUploader from '../components/VideoUploader/VideoUploader'
import { useAuth } from '../contexts/AuthContext'
import { fetchContent, getStreamUrl } from '../services/contentApi'
import type { ContentDto, TranscriptionDto } from '../types/content-api.d.ts'
import './Uploads.css'

const UPLOAD_ENDPOINT = (import.meta.env.VITE_UPLOAD_ENDPOINT as string | undefined) ?? ''
const POLL_INTERVAL_MS = 3000

export default function Uploads() {
  const { token } = useAuth()
  const [contentId, setContentId] = useState<string | null>(null)
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined

  return (
    <div className="uploads-page">
      <h1>Upload Video</h1>
      <VideoUploader endpoint={UPLOAD_ENDPOINT} headers={headers} onUploadComplete={setContentId} />
      {contentId != null && <ContentResult key={contentId} contentId={contentId} />}
    </div>
  )
}

function ContentResult({ contentId }: { contentId: string }) {
  const [content, setContent] = useState<ContentDto | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      const data = await fetchContent(contentId)
      if (cancelled) return
      if (data) {
        setContent(data)
        const done = data.transcription?.status === 'completed' || data.transcription?.status === 'failed'
        if (done && timerRef.current != null) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    }

    void poll()
    timerRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      if (timerRef.current != null) clearInterval(timerRef.current)
    }
  }, [contentId])

  const streamUrl = getStreamUrl(contentId)

  return (
    <div className="content-result">
      <div className="content-result-header">
        <h2 className="content-result-title">{content?.filename ?? 'Processing…'}</h2>
        {content && (
          <span className="content-result-meta">
            {formatBytes(content.fileSize)}
            {content.duration != null && ` · ${formatDuration(content.duration)}`}
          </span>
        )}
      </div>

      <video
        key={streamUrl}
        src={streamUrl}
        controls
        className="content-video"
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
