/** FormData fields sent with each chunk POST to /api/upload/chunk */
export interface ChunkUploadFormData {
  /** UUID identifying the upload session (generated client-side via crypto.randomUUID()) */
  uploadId: string
  /** 0-based index of this chunk */
  chunkIndex: number
  /** Total number of chunks in the upload */
  totalChunks: number
  /** Original filename — must end with .mp4 */
  filename: string
  /** MIME type of the file — server requires 'video/mp4' */
  mimeType: 'video/mp4'
  /** Binary chunk slice (max 2MB per chunk; last chunk may be smaller) */
  chunk: Blob
}

/** Headers sent alongside each chunk request */
export interface ChunkUploadHeaders {
  /** UUID identifying the upload session */
  'x-upload-id': string
  /** 0-based chunk index as a string */
  'x-chunk-index': string
  /** Total number of chunks as a string */
  'x-total-chunks': string
  /** URL-encoded original filename (encodeURIComponent) */
  'x-filename': string
}

/** Response body on success (HTTP 200) */
export interface ChunkUploadSuccessResponse {
  ok: true
  /** UUID identifying the upload session */
  uploadId: string
  /** 0-based index of the chunk just accepted */
  chunkIndex: number
}

/** Response body on error (HTTP 400 | 415 | 422 | 500) */
export interface ChunkUploadErrorResponse {
  ok: false
  /** Human-readable error message */
  error: string
}

export type ChunkUploadResponse = ChunkUploadSuccessResponse | ChunkUploadErrorResponse

/**
 * HTTP status codes returned by POST /api/upload/chunk:
 * 200 — chunk accepted (final chunk triggers file assembly)
 * 400 — bad parameters (invalid UUID, bad filename, out-of-range index)
 * 415 — wrong MIME type (must be video/mp4)
 * 422 — chunk too large or PHP upload error
 * 500 — server-side storage failure
 */
export type ChunkUploadStatusCode = 200 | 400 | 415 | 422 | 500

/** Client-side chunk size — 2MB */
export declare const CHUNK_SIZE: 2097152

/** Maximum chunk size accepted by the server — 10MB */
export declare const MAX_CHUNK_SIZE: 10485760
