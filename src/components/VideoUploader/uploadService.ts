import { authFetch } from '../../lib/authFetch'

export const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB

export interface ChunkUploadOptions {
  endpoint: string
  headers?: Record<string, string>
  title?: string
  signal: AbortSignal
  onProgress: (bytesUploaded: number, bytesTotal: number) => void
}

export interface UploadResult {
  /** UUID of the assembled Content record — set only on the final chunk */
  contentId: string | undefined
}

export async function uploadInChunks(file: File, options: ChunkUploadOptions): Promise<UploadResult> {
  const { endpoint, headers = {}, title, signal, onProgress } = options
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  const uploadId = crypto.randomUUID()
  let contentId: string | undefined

  for (let index = 0; index < totalChunks; index++) {
    if (signal.aborted) throw new DOMException('Upload cancelled', 'AbortError')

    const start = index * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)

    const body = new FormData()
    body.append('uploadId', uploadId)
    body.append('chunkIndex', String(index))
    body.append('totalChunks', String(totalChunks))
    body.append('filename', file.name)
    body.append('mimeType', file.type)
    body.append('chunk', file.slice(start, end))
    if (title) body.append('title', title)

    const res = await authFetch(endpoint, {
      method: 'POST',
      headers: {
        ...headers,
        'x-upload-id': uploadId,
        'x-chunk-index': String(index),
        'x-total-chunks': String(totalChunks),
        'x-filename': encodeURIComponent(file.name),
      },
      body,
      signal,
    })

    if (!res.ok) {
      throw new Error(`Chunk ${index + 1}/${totalChunks} failed — ${res.status} ${res.statusText}`)
    }

    const data = await res.json() as { ok: boolean; contentId?: string }
    if (data.contentId) contentId = data.contentId

    onProgress(end, file.size)
  }

  return { contentId }
}
