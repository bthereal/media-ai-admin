import { Link } from 'react-router'
import { getThumbnailUrl } from '../../services/contentApi'
import type { ContentDto } from '../../types/content-api.d.ts'
import './RelatedVideosRail.css'

export default function RelatedVideosRail({ videos }: { videos: ContentDto[] }) {
  return (
    <div className="related-videos">
      <h2 className="related-videos-title">More like this</h2>
      <div className="related-videos-rail">
        {videos.map(video => (
          <Link key={video.id} to={`/media/${video.id}`} className="related-video-card">
            {video.hasThumbnail ? (
              <img src={getThumbnailUrl(video.id)} alt="" className="related-video-thumb" loading="lazy" />
            ) : (
              <div className="related-video-thumb related-video-thumb-empty" />
            )}
            <span className="related-video-title">{video.title ?? video.filename}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
