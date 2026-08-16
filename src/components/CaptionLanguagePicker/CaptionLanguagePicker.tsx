import type { LanguageOptionDto } from '../../types/content-api.d.ts'
import './CaptionLanguagePicker.css'

export default function CaptionLanguagePicker({
  options,
  active,
  onAdd,
}: {
  options: LanguageOptionDto[]
  active: string[]
  onAdd: (code: string) => void
}) {
  return (
    <div className="caption-picker">
      <span className="caption-picker-label">Captions:</span>
      {options.map(option => {
        const isActive = active.includes(option.code)
        return (
          <button
            key={option.code}
            type="button"
            className="caption-picker-btn"
            onClick={() => onAdd(option.code)}
            disabled={isActive}
          >
            {isActive ? `${option.label} ✓` : option.label}
          </button>
        )
      })}
    </div>
  )
}
