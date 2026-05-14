import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { fetchContent, getStreamUrl, updateContentTitle } from '../services/contentApi'
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
        {content
          ? <TitleEditor content={content} onSave={updated => setContent(updated)} />
          : <h1 className="detail-title">Loading…</h1>
        }
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

function TitleEditor({ content, onSave }: { content: ContentDto; onSave: (updated: ContentDto) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(content.title ?? '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEditing() {
    setValue(content.title ?? '')
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function cancel() {
    setEditing(false)
  }

  async function save() {
    const trimmed = value.trim()
    const next = trimmed === '' ? null : trimmed
    if (next === content.title) { setEditing(false); return }
    setSaving(true)
    const updated = await updateContentTitle(content.id, next)
    setSaving(false)
    if (updated) { onSave(updated); setEditing(false) }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') void save()
    if (e.key === 'Escape') cancel()
  }

  if (editing) {
    return (
      <div className="title-editor">
        <input
          ref={inputRef}
          className="title-input"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={255}
          placeholder={content.filename}
          autoFocus
        />
        <button className="title-btn title-btn-save" onClick={() => void save()} disabled={saving}>
          {saving ? '…' : 'Save'}
        </button>
        <button className="title-btn title-btn-cancel" onClick={cancel} disabled={saving}>
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button className="title-display" onClick={startEditing} title="Click to edit title">
      <h1 className="detail-title">{content.title ?? content.filename}</h1>
      <svg className="title-edit-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
      </svg>
    </button>
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
