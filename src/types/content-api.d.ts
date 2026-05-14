/** Transcription record attached to a Content item */
export interface TranscriptionDto {
  /** Processing stage of the transcription job */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** Transcribed text — null until status reaches 'completed' */
  text: string | null
  /** ISO 8601 timestamp when transcription finished — null until completed */
  completedAt: string | null
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
