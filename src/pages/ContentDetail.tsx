import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { deleteContent, fetchContent, generateSummary, getStreamUrl, updateContent } from '../services/contentApi'
import type { ContentDto } from '../types/content-api.d.ts'
import './ContentDetail.css'

const POLL_INTERVAL_MS = 3000

export default function ContentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [content, setContent] = useState<ContentDto | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [summaryInput, setSummaryInput] = useState('')
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const titleInitialized = useRef(false)
  const summaryInitialized = useRef(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function poll() {
      const data = await fetchContent(id!)
      if (cancelled) return
      if (data === null) { setNotFound(true); return }
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

  useEffect(() => {
    if (!content) return
    if (!titleInitialized.current && content.title) {
      setTitleInput(content.title)
      titleInitialized.current = true
    }
    if (!summaryInitialized.current && content.transcription?.summary) {
      setSummaryInput(content.transcription.summary)
      summaryInitialized.current = true
    }
  }, [content])

  async function handleSave() {
    if (!id) return
    setSaving(true)
    setSaveSuccess(false)
    const updated = await updateContent(id, {
      title: titleInput.trim() || null,
      summary: summaryInput.trim() || null,
    })
    setSaving(false)
    if (updated) {
      setContent(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    }
  }

  async function handleGenerateSummary() {
    if (!id) return
    setGeneratingSummary(true)
    const updated = await generateSummary(id)
    setGeneratingSummary(false)
    if (updated?.transcription?.summary) {
      setSummaryInput(updated.transcription.summary)
      setContent(updated)
    }
  }

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    const ok = await deleteContent(id)
    if (ok) {
      void navigate('/media', { replace: true })
    } else {
      setDeleting(false)
    }
  }

  if (notFound) {
    return (
      <div className="content-detail">
        <Link to="/media" className="back-link">← Media Library</Link>
        <p className="detail-not-found">Video not found.</p>
      </div>
    )
  }

  const transcription = content?.transcription ?? null
  const transcriptReady = transcription?.status === 'completed'
  const streamUrl = id ? getStreamUrl(id) : ''

  return (
    <div className="content-detail">
      <Link to="/media" className="back-link">← Media Library</Link>

      <video
        key={streamUrl}
        src={streamUrl}
        controls
        className="detail-video"
        preload="metadata"
      />

      <div className="detail-form">
        <div className="form-field">
          <label className="form-label" htmlFor="cd-title">Title</label>
          <input
            id="cd-title"
            className="form-input"
            type="text"
            maxLength={255}
            placeholder={content?.filename ?? 'Loading…'}
            value={titleInput}
            onChange={e => setTitleInput(e.target.value)}
          />
        </div>

        <div className="form-field">
          <div className="detail-summary-header">
            <label className="form-label" htmlFor="cd-summary">Summary</label>
            {transcriptReady && (
              <button
                type="button"
                className="detail-generate-btn"
                onClick={() => void handleGenerateSummary()}
                disabled={generatingSummary}
                title="Generate summary from transcript"
              >
                {generatingSummary ? <SpinnerIcon /> : <RegenerateIcon />}
              </button>
            )}
          </div>
          <textarea
            id="cd-summary"
            className="form-input detail-summary"
            maxLength={200}
            rows={3}
            placeholder={
              !transcriptReady
                ? (transcription === null || transcription.status === 'pending' || transcription.status === 'processing'
                    ? 'Waiting for transcription…'
                    : 'Transcription failed')
                : 'Click ↺ to generate a summary from the transcript'
            }
            value={summaryInput}
            onChange={e => setSummaryInput(e.target.value)}
          />
          <span className="detail-charcount">{summaryInput.length}/200</span>
        </div>

        {transcriptReady && transcription.text && (
          <div className="detail-transcript">
            <button
              type="button"
              className="detail-transcript-toggle"
              onClick={() => setTranscriptOpen(o => !o)}
              aria-expanded={transcriptOpen}
            >
              <span>Transcript</span>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className={`detail-chevron${transcriptOpen ? ' detail-chevron-open' : ''}`}
              >
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
            {transcriptOpen && (
              <p className="detail-transcript-text">{transcription.text}</p>
            )}
          </div>
        )}

        {!transcriptReady && transcription?.status !== 'failed' && (
          <div className="detail-transcribing">
            <Spinner />
            {transcription === null || transcription.status === 'pending'
              ? 'Waiting for transcription…'
              : 'Transcribing audio…'}
          </div>
        )}

        <div className="detail-actions">
          <button
            type="button"
            className="btn-delete"
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
          <div className="detail-actions-right">
            {saveSuccess && <span className="detail-saved">Saved</span>}
            <button
              type="button"
              className="btn-primary"
              onClick={() => void handleSave()}
              disabled={saving || !content}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
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

function RegenerateIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="detail-generate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
    </svg>
  )
}
