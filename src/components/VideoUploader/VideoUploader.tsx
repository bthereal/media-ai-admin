import { useEffect, useRef, useState } from 'react'
import { useChunkedUpload } from './useChunkedUpload'
import './VideoUploader.css'

interface VideoUploaderProps {
  endpoint: string
  headers?: Record<string, string>
  onUploadComplete?: (contentId: string) => void
  onFileSelected?: (file: File) => void
}

export default function VideoUploader({ endpoint, headers, onUploadComplete, onFileSelected }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)
  const { status, progress, error, contentId, upload, cancel, reset } = useChunkedUpload()

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (status === 'complete' && contentId != null) {
      onUploadComplete?.(contentId)
    }
  }, [status, contentId, onUploadComplete])

  function selectFile(selected: File) {
    if (selected.type !== 'video/mp4' && !selected.name.toLowerCase().endsWith('.mp4')) {
      setFileError('Only .mp4 files are supported')
      return
    }
    setFileError(null)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(selected)
    previewUrlRef.current = url
    setFile(selected)
    setPreviewUrl(url)
    setTitle(selected.name.replace(/\.mp4$/i, ''))
    reset()
    onFileSelected?.(selected)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) selectFile(selected)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) selectFile(dropped)
  }

  function handleReset() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    setFile(null)
    setTitle('')
    setPreviewUrl(null)
    setFileError(null)
    reset()
    if (inputRef.current) inputRef.current.value = ''
  }

  const isUploading = status === 'uploading'

  return (
    <div className="video-uploader">
      {!file ? (
        <div
          className={`drop-zone${dragActive ? ' drag-active' : ''}`}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Select an MP4 file to upload"
        >
          <svg className="drop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          <p className="drop-label">Drop an MP4 here or <span className="drop-browse">browse</span></p>
          <p className="drop-hint">MP4 only</p>
          {fileError && <p className="drop-error" role="alert">{fileError}</p>}
          <input ref={inputRef} type="file" accept=".mp4,video/mp4" onChange={handleInputChange} hidden />
        </div>
      ) : (
        <div className="preview-area">
          <video key={previewUrl ?? ''} src={previewUrl ?? ''} controls className="video-preview" />

          <div className="upload-panel">
            <div className="file-info">
              <span className="file-name" title={file.name}>{file.name}</span>
              <span className="file-size">{formatBytes(file.size)}</span>
            </div>

            {status === 'idle' && (
              <div className="upload-title-field">
                <label className="upload-title-label" htmlFor="vu-title">Title</label>
                <input
                  id="vu-title"
                  className="upload-title-input"
                  type="text"
                  maxLength={255}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={file.name.replace(/\.mp4$/i, '')}
                />
              </div>
            )}

            {isUploading && (
              <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
            )}

            {error && <p className="upload-error" role="alert">{error}</p>}

            <div className="upload-actions">
              {status === 'idle' && (
                <button type="button" className="btn-primary" onClick={() => upload(file, endpoint, headers, title.trim() || undefined)}>
                  Upload
                </button>
              )}
              {isUploading && (
                <>
                  <span className="progress-label">{progress}%</span>
                  <button type="button" className="btn-ghost" onClick={cancel}>Cancel</button>
                </>
              )}
              {status === 'complete' && <span className="status-success">Upload complete</span>}
              {(status === 'complete' || status === 'error') && (
                <button type="button" className="btn-ghost" onClick={handleReset}>Upload another</button>
              )}
              {status === 'idle' && (
                <button type="button" className="btn-ghost" onClick={handleReset}>Remove</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
