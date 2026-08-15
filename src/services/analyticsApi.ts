import { authFetch, UnauthorizedError } from '../lib/authFetch'
import type { AnalyticsOverviewDto, ProgressDto, VideoAnalyticsDto, WatchEventType } from '../types/analytics-api.d.ts'

const CONTENT_BASE = (import.meta.env.VITE_CONTENT_ENDPOINT as string | undefined) ?? '/api/content'
const ANALYTICS_BASE = (import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined) ?? '/api/analytics'

export async function fetchVideoAnalytics(id: string): Promise<VideoAnalyticsDto | null> {
  try {
    const res = await authFetch(`${CONTENT_BASE}/${id}/analytics`)
    if (!res.ok) return null
    const data = (await res.json()) as VideoAnalyticsDto
    return data.ok ? data : null
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverviewDto | null> {
  try {
    const res = await authFetch(`${ANALYTICS_BASE}/overview`)
    if (!res.ok) return null
    const data = (await res.json()) as AnalyticsOverviewDto
    return data.ok ? data : null
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

export async function fetchProgress(id: string): Promise<number | null> {
  try {
    const res = await authFetch(`${CONTENT_BASE}/${id}/progress`)
    if (!res.ok) return null
    const data = (await res.json()) as ProgressDto
    return data.ok ? data.positionSeconds : null
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err
    return null
  }
}

/**
 * Fire-and-forget playback event ping — failures are swallowed so a flaky
 * analytics call never interrupts video playback.
 */
export async function recordWatchEvent(id: string, eventType: WatchEventType, positionSeconds: number): Promise<void> {
  try {
    await authFetch(`${CONTENT_BASE}/${id}/watch-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, positionSeconds }),
    })
  } catch {
    // analytics is best-effort; ignore network/auth errors here
  }
}
