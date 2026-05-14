import { useCallback, useRef, useState } from 'react'
import { uploadInChunks } from './uploadService'

type UploadStatus = 'idle' | 'uploading' | 'complete' | 'error'

interface UploadState {
  status: UploadStatus
  progress: number
  error: string | null
}

export interface UseChunkedUploadReturn extends UploadState {
  upload: (file: File, endpoint: string, headers?: Record<string, string>) => Promise<void>
  cancel: () => void
  reset: () => void
}

export function useChunkedUpload(): UseChunkedUploadReturn {
  const [state, setState] = useState<UploadState>({ status: 'idle', progress: 0, error: null })
  const abortRef = useRef<AbortController | null>(null)

  const upload = useCallback(async (
    file: File,
    endpoint: string,
    headers?: Record<string, string>,
  ) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState({ status: 'uploading', progress: 0, error: null })

    try {
      await uploadInChunks(file, {
        endpoint,
        headers,
        signal: controller.signal,
        onProgress: (uploaded, total) => {
          setState(prev => ({ ...prev, progress: Math.round((uploaded / total) * 100) }))
        },
      })
      setState({ status: 'complete', progress: 100, error: null })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setState({ status: 'idle', progress: 0, error: null })
      } else {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
        }))
      }
    }
  }, [])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState({ status: 'idle', progress: 0, error: null })
  }, [])

  return { ...state, upload, cancel, reset }
}
