import { useEffect } from 'react'
import type { RefObject } from 'react'
import { recordWatchEvent } from '../services/analyticsApi'

const HEARTBEAT_INTERVAL_MS = 5000

/**
 * Wires a <video> element's playback events to POST /api/content/{id}/watch-events.
 * "progress" heartbeats are throttled to one per HEARTBEAT_INTERVAL_MS of active
 * playback (matching the backend's watch-time approximation) rather than firing
 * on every native `timeupdate` tick.
 */
export function usePlaybackTracking(contentId: string | undefined, videoRef: RefObject<HTMLVideoElement | null>): void {
  useEffect(() => {
    const video = videoRef.current
    if (!video || !contentId) return

    let lastHeartbeatAt = 0

    const onPlay = () => void recordWatchEvent(contentId, 'play', video.currentTime)
    const onPause = () => void recordWatchEvent(contentId, 'pause', video.currentTime)
    const onSeeked = () => void recordWatchEvent(contentId, 'seek', video.currentTime)
    const onEnded = () => void recordWatchEvent(contentId, 'complete', video.currentTime)
    const onTimeUpdate = () => {
      if (video.paused) return
      const now = Date.now()
      if (now - lastHeartbeatAt < HEARTBEAT_INTERVAL_MS) return
      lastHeartbeatAt = now
      void recordWatchEvent(contentId, 'progress', video.currentTime)
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('ended', onEnded)
    video.addEventListener('timeupdate', onTimeUpdate)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [contentId, videoRef])
}
