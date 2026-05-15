import { useEffect, useRef, useState } from 'react'
import VideoUploader from '../components/VideoUploader/VideoUploader'
import { useAuth } from '../contexts/AuthContext'
import { fetchContent, generateSummary, getStreamUrl, updateContent } from '../services/contentApi'
import type { ContentDto } from '../types/content-api.d.ts'
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
      {contentId === null ? (
        <VideoUploader
          key="uploader"
          endpoint={UPLOAD_ENDPOINT}
          headers={headers}
          onUploadComplete={setContentId}
        />
      ) : (
        <PostUploadView
          key={contentId}
          contentId={contentId}
          onReset={() => setContentId(null)}
        />
      )}
    </div>
  )
}

function PostUploadView({ contentId, onReset }: { contentId: string; onReset: () => void }) {
  const [content, setContent] = useState<ContentDto | null>(null)
  const [titleInput, setTitleInput] = useState('')
  const [summaryInput, setSummaryInput] = useState('')
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const titleInitialized = useRef(false)
  const summaryInitialized = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      const data = await fetchContent(contentId)
      if (cancelled) return
      if (!data) return
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
  }, [contentId])

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
    setSaving(true)
    setSaveSuccess(false)
    const updated = await updateContent(contentId, {
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
    setGeneratingSummary(true)
    const updated = await generateSummary(contentId)
    setGeneratingSummary(false)
    if (updated?.transcription?.summary) {
      setSummaryInput(updated.transcription.summary)
      setContent(updated)
    }
  }

  const transcription = content?.transcription ?? null
  const transcriptReady = transcription?.status === 'completed'

  return (
    <div className="post-upload">
      <video
        src={getStreamUrl(contentId)}
        controls
        className="post-upload-video"
        preload="metadata"
      />

      <div className="post-upload-form">
        <div className="form-field">
          <label className="form-label" htmlFor="pu-title">Title</label>
          <input
            id="pu-title"
            className="form-input"
            type="text"
            maxLength={255}
            placeholder={content?.filename ?? 'Loading…'}
            value={titleInput}
            onChange={e => setTitleInput(e.target.value)}
          />
        </div>

        <div className="form-field">
          <div className="post-upload-summary-header">
            <label className="form-label" htmlFor="pu-summary">Summary</label>
            {transcriptReady && (
              <button
                type="button"
                className="post-upload-generate-btn"
                onClick={() => void handleGenerateSummary()}
                disabled={generatingSummary}
                title="Generate summary from transcript"
              >
                {generatingSummary
                  ? <SpinnerIcon className="post-upload-generate-spin" />
                  : <RegenerateIcon />}
              </button>
            )}
          </div>
          <textarea
            id="pu-summary"
            className="form-input post-upload-summary"
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
          <span className="post-upload-charcount">{summaryInput.length}/200</span>
        </div>

        {transcriptReady && transcription.text && (
          <div className="post-upload-transcript">
            <button
              type="button"
              className="post-upload-transcript-toggle"
              onClick={() => setTranscriptOpen(o => !o)}
              aria-expanded={transcriptOpen}
            >
              <span>Transcript</span>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className={`transcript-chevron${transcriptOpen ? ' transcript-chevron-open' : ''}`}
              >
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
            {transcriptOpen && (
              <p className="post-upload-transcript-text">{transcription.text}</p>
            )}
          </div>
        )}

        {!transcriptReady && transcription?.status !== 'failed' && (
          <div className="post-upload-transcribing">
            <SpinnerIcon className="spinner" />
            {transcription === null || transcription.status === 'pending'
              ? 'Waiting for transcription…'
              : 'Transcribing audio…'}
          </div>
        )}

        <div className="post-upload-actions">
          <button type="button" className="btn-ghost" onClick={onReset}>
            Upload another
          </button>
          {saveSuccess && <span className="post-upload-saved">Saved</span>}
          <button
            type="button"
            className="btn-primary"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RegenerateIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
    </svg>
  )
}
