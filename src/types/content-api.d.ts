/** An AI-generated chapter marker */
export interface ChapterDto {
  title: string
  startSeconds: number
  endSeconds: number
}

/** A selectable caption language */
export interface LanguageOptionDto {
  /** ISO 639-1 code, e.g. "es" */
  code: string
  label: string
}

/** Caption availability for a video — null until transcription completes with timed segments */
export interface CaptionsInfoDto {
  /** Always available — served directly from stored segments, no AI call */
  nativeLanguage: LanguageOptionDto
  /** Curated set of languages that can be requested — translated and cached on first request */
  availableTranslations: LanguageOptionDto[]
}

/** Transcription record attached to a Content item */
export interface TranscriptionDto {
  /** Processing stage of the transcription job */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** Transcribed text — null until status reaches 'completed' */
  text: string | null
  /** AI-generated ≤200-char summary — null until embedding step completes */
  summary: string | null
  /** ISO 8601 timestamp when transcription finished — null until completed */
  completedAt: string | null
  /** AI-generated chapters — null until the post-transcription chapter step has run, empty if it ran but produced none */
  chapters: ChapterDto[] | null
  /** Caption/subtitle availability — null until transcription has completed with timed segments */
  captions: CaptionsInfoDto | null
}

/** Full content record returned by GET /api/content/{id} */
export interface ContentDto {
  ok: true
  /** UUID of the content record */
  id: string
  /** User-defined title; null until set */
  title: string | null
  /** Stored filename (e.g. "video.mp4") */
  filename: string
  /** UUID prefix used to locate the file in storage */
  uploadId: string
  /** MIME type — always "video/mp4" for now */
  mimeType: string
  /** File size in bytes */
  fileSize: number
  /** Duration in seconds, null if ffprobe could not determine it */
  duration: number | null
  /** Whether a JPEG thumbnail has been generated for this video */
  hasThumbnail: boolean
  /** ISO 8601 creation timestamp */
  createdAt: string
  /** ISO 8601 timestamp when archived; null if active */
  deletedAt: string | null
  /** Attached transcription job, or null if none exists */
  transcription: TranscriptionDto | null
}

export interface ContentNotFoundResponse {
  ok: false
  error: string
}

export type ContentResponse = ContentDto | ContentNotFoundResponse

/** Paginated response from GET /api/content */
export interface ContentListDto {
  ok: true
  items: ContentDto[]
  total: number
  page: number
  perPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}
