export const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB

export interface ChunkUploadOptions {
  endpoint: string
  headers?: Record<string, string>
  signal: AbortSignal
  onProgress: (bytesUploaded: number, bytesTotal: number) => void
}

export async function uploadInChunks(file: File, options: ChunkUploadOptions): Promise<void> {
  const { endpoint, headers = {}, signal, onProgress } = options
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  const uploadId = crypto.randomUUID()

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

    const res = await fetch(endpoint, {
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

    onProgress(end, file.size)
  }
}
