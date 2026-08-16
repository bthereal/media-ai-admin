import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import AddToPlaylistMenu from '../components/AddToPlaylistMenu/AddToPlaylistMenu'
import CaptionLanguagePicker from '../components/CaptionLanguagePicker/CaptionLanguagePicker'
import ChapterRail from '../components/ChapterRail/ChapterRail'
import RelatedVideosRail from '../components/RelatedVideosRail/RelatedVideosRail'
import { useCaptionTracks } from '../hooks/useCaptionTracks'
import { usePlaybackTracking } from '../hooks/usePlaybackTracking'
import { fetchProgress, fetchVideoAnalytics } from '../services/analyticsApi'
import { deleteContent, fetchContent, fetchRelatedVideos, generateSummary, getCaptionsUrl, getStreamUrl, getThumbnailUrl, regenerateThumbnail, updateContent } from '../services/contentApi'
import type { RetentionPointDto, VideoAnalyticsDto } from '../types/analytics-api.d.ts'
import type { ContentDto } from '../types/content-api.d.ts'
import './ContentDetail.css'

const POLL_INTERVAL_MS = 3000
// After transcription completes, chapters generate as a separate async step — keep
// polling a little longer for them before giving up (chapters are enhancement-only).
const MAX_CHAPTER_WAIT_POLLS = 20

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
  const [regeneratingThumbnail, setRegeneratingThumbnail] = useState(false)
  const [thumbnailVersion, setThumbnailVersion] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const titleInitialized = useRef(false)
  const summaryInitialized = useRef(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [analytics, setAnalytics] = useState<VideoAnalyticsDto | null>(null)
  const [relatedVideos, setRelatedVideos] = useState<ContentDto[] | null>(null)
  const [resumePosition, setResumePosition] = useState<number | null>(null)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const { tracks: captionTracks, activeTranslations, addLanguage: handleAddCaptionLanguage } = useCaptionTracks(id, content?.transcription?.captions)

  usePlaybackTracking(id, videoRef)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetchVideoAnalytics(id).then(data => {
      if (!cancelled) setAnalytics(data)
    })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetchRelatedVideos(id).then(data => {
      if (!cancelled) setRelatedVideos(data)
    })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetchProgress(id).then(position => {
      if (cancelled) return
      setResumePosition(position)
      setShowResumePrompt(position != null)
    })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onPlay = () => setShowResumePrompt(false)
    video.addEventListener('play', onPlay)
    return () => video.removeEventListener('play', onPlay)
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    let chapterWaitPolls = 0

    async function poll() {
      const data = await fetchContent(id!)
      if (cancelled) return
      if (data === null) { setNotFound(true); return }
      setContent(data)

      const failed = data.transcription?.status === 'failed'
      const completed = data.transcription?.status === 'completed'
      const chaptersReady = data.transcription?.chapters != null
      let done = failed || (completed && chaptersReady)

      if (completed && !chaptersReady) {
        chapterWaitPolls += 1
        if (chapterWaitPolls >= MAX_CHAPTER_WAIT_POLLS) done = true
      }

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

  async function handleRegenerateThumbnail() {
    if (!id) return
    setRegeneratingThumbnail(true)
    const updated = await regenerateThumbnail(id)
    setRegeneratingThumbnail(false)
    if (updated) {
      setContent(updated)
      setThumbnailVersion(Date.now())
    }
  }

  function seekTo(seconds: number, play = false) {
    const video = videoRef.current
    if (!video) return
    const apply = () => {
      video.currentTime = seconds
      if (play) void video.play()
    }
    if (video.readyState >= 1) {
      apply()
    } else {
      video.addEventListener('loadedmetadata', apply, { once: true })
    }
  }

  function handleResume() {
    if (resumePosition == null) return
    seekTo(resumePosition)
    setShowResumePrompt(false)
  }

  function handleDismissResume() {
    setShowResumePrompt(false)
  }

  function handleChapterClick(startSeconds: number) {
    seekTo(startSeconds, true)
    setShowResumePrompt(false)
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
      <div className="detail-top-row">
        <Link to="/media" className="back-link">← Media Library</Link>
        {id && (
          <div className="detail-add-to-playlist">
            <AddToPlaylistMenu contentId={id} label="Add to playlist" />
          </div>
        )}
      </div>

      <video
        key={streamUrl}
        ref={videoRef}
        src={streamUrl}
        controls
        className="detail-video"
        preload="metadata"
      >
        {id && captionTracks.map((track, i) => (
          <track
            key={track.code}
            kind="subtitles"
            src={getCaptionsUrl(id, track.code)}
            srcLang={track.code}
            label={track.label}
            default={0 === i}
          />
        ))}
      </video>

      {content?.transcription?.captions && content.transcription.captions.availableTranslations.length > 0 && (
        <CaptionLanguagePicker
          options={content.transcription.captions.availableTranslations}
          active={activeTranslations}
          onAdd={handleAddCaptionLanguage}
        />
      )}

      {showResumePrompt && resumePosition != null && (
        <div className="resume-prompt">
          <span>Resume at {formatTimestamp(resumePosition)}?</span>
          <div className="resume-prompt-actions">
            <button type="button" className="resume-prompt-btn resume-prompt-btn-primary" onClick={handleResume}>
              Resume
            </button>
            <button type="button" className="resume-prompt-btn" onClick={handleDismissResume}>
              Start over
            </button>
          </div>
        </div>
      )}

      {content?.transcription?.chapters != null && content.transcription.chapters.length > 0 && (
        <ChapterRail chapters={content.transcription.chapters} onSelect={handleChapterClick} />
      )}

      {relatedVideos && relatedVideos.length > 0 && (
        <RelatedVideosRail videos={relatedVideos} />
      )}

      {analytics && analytics.views > 0 && (
        <VideoAnalyticsSection analytics={analytics} />
      )}

      <div className="detail-form">
        <div className="form-field">
          <div className="detail-summary-header">
            <label className="form-label">Thumbnail</label>
            <button
              type="button"
              className="detail-generate-btn"
              onClick={() => void handleRegenerateThumbnail()}
              disabled={regeneratingThumbnail}
              title="Regenerate thumbnail — AI picks the best frame"
            >
              {regeneratingThumbnail ? <SpinnerIcon /> : <RegenerateIcon />}
            </button>
          </div>
          {content?.hasThumbnail ? (
            <img
              src={getThumbnailUrl(content.id, thumbnailVersion || undefined)}
              alt="Thumbnail"
              className="detail-thumbnail-preview"
            />
          ) : (
            <div className="detail-thumbnail-placeholder">
              {regeneratingThumbnail ? 'Generating…' : 'No thumbnail yet'}
            </div>
          )}
        </div>

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

        {(content?.transcription?.category || (content?.transcription?.tags && content.transcription.tags.length > 0)) && (
          <div className="form-field">
            <label className="form-label">Category &amp; tags</label>
            <div className="detail-tags-row">
              {content?.transcription?.category && (
                <Link
                  to={`/media?category=${encodeURIComponent(content.transcription.category)}`}
                  className="badge badge-category detail-category-badge detail-category-badge-link"
                  title={`Browse all "${content.transcription.category}" videos`}
                >
                  {content.transcription.category}
                </Link>
              )}
              {content?.transcription?.tags?.map(tag => (
                <span key={tag} className="detail-tag-chip">{tag}</span>
              ))}
            </div>
          </div>
        )}

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


function VideoAnalyticsSection({ analytics }: { analytics: VideoAnalyticsDto }) {
  return (
    <div className="detail-analytics">
      <div className="stat-row">
        <div className="stat-tile">
          <p className="stat-tile-label">Views</p>
          <p className="stat-tile-value">{analytics.views.toLocaleString()}</p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile-label">Completion rate</p>
          <p className="stat-tile-value">{analytics.completionRate.toFixed(0)}%</p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile-label">Avg. watch time</p>
          <p className="stat-tile-value">{formatSeconds(analytics.averageWatchTimeSeconds)}</p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile-label">Avg. drop-off point</p>
          <p className="stat-tile-value">{analytics.averageDropOffSeconds != null ? formatSeconds(analytics.averageDropOffSeconds) : '—'}</p>
        </div>
      </div>

      {analytics.retentionCurve.length > 0 && (
        <div className="chart-card">
          <h2 className="chart-card-title">Retention curve</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={analytics.retentionCurve} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="percent"
                type="number"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fill: 'var(--text)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fill: 'var(--text)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<RetentionTooltip />} cursor={{ stroke: 'var(--border)' }} />
              <Area
                type="monotone"
                dataKey="retentionRate"
                stroke="var(--chart-accent)"
                strokeWidth={2}
                fill="var(--chart-accent)"
                fillOpacity={0.12}
                dot={false}
                activeDot={{ r: 5, stroke: 'var(--bg)', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

interface RetentionTooltipPayloadItem {
  payload: RetentionPointDto
}

function RetentionTooltip({ active, payload }: { active?: boolean; payload?: RetentionTooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-value">{point.retentionRate.toFixed(0)}% still watching</p>
      <p className="chart-tooltip-label">at {point.percent}% through the video</p>
    </div>
  )
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const totalMinutes = Math.round(seconds / 60)
  if (totalMinutes < 60) return `${totalMinutes}m`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
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
