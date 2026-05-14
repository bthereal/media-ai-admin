import VideoUploader from '../components/VideoUploader/VideoUploader'

const UPLOAD_ENDPOINT = (import.meta.env.VITE_UPLOAD_ENDPOINT as string | undefined) ?? ''

export default function Uploads() {
  return (
    <div>
      <h1>Uploads</h1>
      <VideoUploader endpoint={UPLOAD_ENDPOINT} />
    </div>
  )
}
