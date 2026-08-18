import type { CaptionsInfoDto, LanguageOptionDto } from '../types/content-api.d.ts'

/**
 * Every caption language a video could show — the native transcript language plus
 * the full curated translation-target catalog. Each is rendered as a native
 * <track> element; the browser only fetches (and the backend only translates and
 * caches) a given language the moment a viewer actually selects it from the
 * player's own captions/subtitles menu, so this list being "all of them" costs
 * nothing until someone asks for a specific one.
 */
export function getCaptionTracks(captions: CaptionsInfoDto | null | undefined): LanguageOptionDto[] {
  if (!captions) return []

  return [captions.nativeLanguage, ...captions.availableTranslations]
}
