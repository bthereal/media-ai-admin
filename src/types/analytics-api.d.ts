/** Playback event kinds accepted by POST /api/content/{id}/watch-events */
export type WatchEventType = 'play' | 'pause' | 'seek' | 'progress' | 'complete'

/** One point on a video's retention curve */
export interface RetentionPointDto {
  /** Position through the video, as a percentage (0, 10, 20, ... 100) */
  percent: number
  /** Percentage of viewers who reached this point (0-100) */
  retentionRate: number
}

/** Per-video watch analytics returned by GET /api/content/{id}/analytics */
export interface VideoAnalyticsDto {
  ok: true
  /** UUID of the content record */
  contentId: string
  /** Distinct viewers who fired at least one playback event */
  views: number
  /** Percentage of viewers who fired a "complete" event (0-100) */
  completionRate: number
  /** Sum of estimated watch time across all viewers, in seconds */
  totalWatchTimeSeconds: number
  /** Average estimated watch time per viewer, in seconds */
  averageWatchTimeSeconds: number
  /** Average furthest position reached across viewers, in seconds — null when there are no views */
  averageDropOffSeconds: number | null
  /** Percentage of viewers still watching at each 10% mark; empty when the video has no known duration */
  retentionCurve: RetentionPointDto[]
}

/** One row in the library-wide overview's per-video summary */
export interface VideoAnalyticsSummaryDto {
  /** UUID of the content record */
  contentId: string
  /** User-defined title; null until set */
  title: string | null
  /** Stored filename (e.g. "video.mp4") */
  filename: string
  /** Distinct viewers who fired at least one playback event */
  views: number
  /** Percentage of viewers who fired a "complete" event (0-100) */
  completionRate: number
  /** Sum of estimated watch time across all viewers, in seconds */
  watchTimeSeconds: number
  /** AI-assigned category (e.g. "Product Demo") — null until tagged */
  category: string | null
}

/** The current viewer's playback progress, returned by GET /api/content/{id}/progress */
export interface ProgressDto {
  ok: true
  /** Where the current viewer left off, in seconds — null when there's nothing worth resuming */
  positionSeconds: number | null
}

/** Library-wide watch analytics returned by GET /api/analytics/overview */
export interface AnalyticsOverviewDto {
  ok: true
  /** Total non-archived content items in the library */
  totalVideos: number
  /** Sum of distinct viewers across all videos */
  totalViews: number
  /** Sum of estimated watch time across all videos, in seconds */
  totalWatchTimeSeconds: number
  /** Average completion rate across videos with at least one view (0-100) */
  averageCompletionRate: number
  /** Per-video summary, sorted by views descending */
  videos: VideoAnalyticsSummaryDto[]
}
