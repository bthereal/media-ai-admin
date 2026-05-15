import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { type SearchResult, type SearchVideoResult, searchContent } from '../../services/contentApi'
import './SearchPanel.css'

const SUGGESTIONS = [
  'Show me videos about machine learning',
  'What videos cover web development?',
  'Videos about project management',
  'Hardware and infrastructure content',
]

interface SearchPanelProps {
  open: boolean
  onClose: () => void
}

export default function SearchPanel({ open, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleSearch() {
    const q = query.trim()
    if (!q || loading) return
    setLoading(true)
    setError(false)
    setResult(null)
    const data = await searchContent(q)
    setLoading(false)
    if (data === null) {
      setError(true)
    } else {
      setResult(data)
    }
  }

  function handleReset() {
    setQuery('')
    setResult(null)
    setError(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleSuggestion(s: string) {
    setQuery(s)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const hasResult = result !== null || error

  return (
    <>
      <div
        className={`sp-backdrop${open ? ' sp-backdrop-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`search-panel${open ? ' search-panel-open' : ''}`}
        aria-label="Video search"
        aria-hidden={!open}
      >
        <div className="sp-header">
          <span className="sp-title">Video Search</span>
          <button type="button" className="sp-close" onClick={onClose} aria-label="Close search">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="sp-body">
          <div className="sp-input-row">
            <input
              ref={inputRef}
              type="text"
              className="sp-input"
              placeholder="Search your video library…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleSearch() }}
              disabled={loading}
              aria-label="Search query"
            />
            <button
              type="button"
              className="sp-search-btn"
              onClick={() => void handleSearch()}
              disabled={!query.trim() || loading}
            >
              {loading ? <Spinner /> : 'Search'}
            </button>
          </div>

          {!hasResult && !loading && (
            <div className="sp-suggestions">
              <p className="sp-suggestions-label">Try searching for</p>
              <ul className="sp-suggestions-list">
                {SUGGESTIONS.map(s => (
                  <li key={s}>
                    <button
                      type="button"
                      className="sp-suggestion"
                      onClick={() => handleSuggestion(s)}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {loading && (
            <div className="sp-loading">
              <Spinner />
              <span>Searching your video library…</span>
            </div>
          )}

          {error && !loading && (
            <div className="sp-error">Search failed. Please try again.</div>
          )}

          {result !== null && !loading && (
            <div className="sp-result">
              <div className="sp-answer">
                <MarkdownBlock text={result.answer} />
              </div>
              {result.videos.length > 0 && (
                <div className="sp-video-cards">
                  {result.videos.map(v => (
                    <VideoCard key={v.id} video={v} onClose={onClose} />
                  ))}
                </div>
              )}
              <div className="sp-result-footer">
                <button type="button" className="sp-reset" onClick={handleReset}>
                  ↺ New search
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

function VideoCard({ video, onClose }: { video: SearchVideoResult; onClose: () => void }) {
  return (
    <Link to={`/media/${video.id}`} className="sp-video-card" onClick={onClose}>
      <span className="sp-video-card-title">{video.title ?? 'Untitled'}</span>
      {video.summary && (
        <span className="sp-video-card-summary">{video.summary}</span>
      )}
    </Link>
  )
}

function MarkdownBlock({ text }: { text: string }) {
  const html = renderMarkdown(text)
  return <div className="sp-markdown" dangerouslySetInnerHTML={{ __html: html }} />
}

function renderMarkdown(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  let inList = false

  for (const raw of lines) {
    const line = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    const inlined = applyInline(line)

    const h3 = inlined.match(/^###\s+(.+)/)
    const h2 = inlined.match(/^##\s+(.+)/)
    const h1 = inlined.match(/^#\s+(.+)/)
    const li = inlined.match(/^[-*]\s+(.+)/)

    if (h3) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<h3>${h3[1]}</h3>`)
    } else if (h2) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<h2>${h2[1]}</h2>`)
    } else if (h1) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<h1>${h1[1]}</h1>`)
    } else if (li) {
      if (!inList) { out.push('<ul>'); inList = true }
      out.push(`<li>${li[1]}</li>`)
    } else if (inlined.trim() === '') {
      if (inList) { out.push('</ul>'); inList = false }
      out.push('<br>')
    } else {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<p>${inlined}</p>`)
    }
  }

  if (inList) out.push('</ul>')
  return out.join('')
}

function applyInline(line: string): string {
  return line
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

function Spinner() {
  return (
    <svg className="sp-spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
    </svg>
  )
}
