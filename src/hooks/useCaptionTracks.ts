import { useState } from 'react'
import type { CaptionsInfoDto } from '../types/content-api.d.ts'

export interface CaptionTrack {
  code: string
  label: string
}

/**
 * Tracks which caption languages are active for the current video — native is always
 * included once available; translations are added lazily via addLanguage() (so
 * switching languages doesn't trigger a translation call for every supported
 * language up front). Resets when resetKey changes (e.g. switching videos).
 */
export function useCaptionTracks(resetKey: string | undefined, captions: CaptionsInfoDto | null | undefined) {
  const [activeTranslations, setActiveTranslations] = useState<string[]>([])
  const [activeResetKey, setActiveResetKey] = useState(resetKey)
  if (resetKey !== activeResetKey) {
    setActiveResetKey(resetKey)
    setActiveTranslations([])
  }

  function addLanguage(code: string) {
    setActiveTranslations(prev => (prev.includes(code) ? prev : [...prev, code]))
  }

  const tracks: CaptionTrack[] = []
  if (captions) {
    tracks.push(captions.nativeLanguage)
    for (const code of activeTranslations) {
      const option = captions.availableTranslations.find(o => o.code === code)
      tracks.push({ code, label: option?.label ?? code })
    }
  }

  return { tracks, activeTranslations, addLanguage }
}
