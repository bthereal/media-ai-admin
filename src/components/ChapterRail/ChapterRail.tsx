import type { ChapterDto } from '../../types/content-api.d.ts'
import './ChapterRail.css'

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ChapterRail({ chapters, onSelect }: { chapters: ChapterDto[]; onSelect: (startSeconds: number) => void }) {
  return (
    <div className="chapter-rail">
      {chapters.map(chapter => (
        <button
          key={`${chapter.startSeconds}-${chapter.title}`}
          type="button"
          className="chapter-chip"
          onClick={() => onSelect(chapter.startSeconds)}
          title={`${formatTimestamp(chapter.startSeconds)}–${formatTimestamp(chapter.endSeconds)}`}
        >
          <span className="chapter-chip-time">
            {formatTimestamp(chapter.startSeconds)}
            <span className="chapter-chip-time-end">{'–'}{formatTimestamp(chapter.endSeconds)}</span>
          </span>
          <span className="chapter-chip-title">{chapter.title}</span>
        </button>
      ))}
    </div>
  )
}
