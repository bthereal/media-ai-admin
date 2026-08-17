import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fetchAnalyticsOverview } from '../services/analyticsApi'
import type { AnalyticsOverviewDto, VideoAnalyticsSummaryDto } from '../types/analytics-api.d.ts'
import './Dashboard.css'

const TOP_VIDEOS_LIMIT = 8

export default function Dashboard() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<AnalyticsOverviewDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetchAnalyticsOverview().then(data => {
      if (cancelled) return
      if (data) {
        setOverview(data)
      } else {
        setError(true)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {loading && <p className="dashboard-loading">Loading…</p>}

      {error && !loading && (
        <p className="dashboard-error">Failed to load analytics. Is the API running?</p>
      )}

      {!loading && !error && overview && (
        overview.totalVideos === 0 ? (
          <p className="dashboard-empty">No videos uploaded yet.</p>
        ) : (
          <>
            <div className="stat-row">
              <StatTile label="Total videos" value={overview.totalVideos.toLocaleString()} />
              <StatTile label="Total views" value={overview.totalViews.toLocaleString()} />
              <StatTile label="Total watch time" value={formatWatchTime(overview.totalWatchTimeSeconds)} />
              <StatTile label="Avg. completion rate" value={`${overview.averageCompletionRate.toFixed(0)}%`} />
            </div>

            {overview.totalViews === 0 ? (
              <p className="dashboard-empty">No playback activity yet — watch analytics will appear here once viewers start watching.</p>
            ) : (
              <div className="chart-card">
                <h2 className="chart-card-title">Top videos by views</h2>
                <TopVideosChart
                  videos={overview.videos.filter(v => v.views > 0).slice(0, TOP_VIDEOS_LIMIT)}
                  onSelect={id => void navigate(`/media/${id}`)}
                />
              </div>
            )}
          </>
        )
      )}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-tile">
      <p className="stat-tile-label">{label}</p>
      <p className="stat-tile-value">{value}</p>
    </div>
  )
}

function TopVideosChart({ videos, onSelect }: { videos: VideoAnalyticsSummaryDto[]; onSelect: (id: string) => void }) {
  const data = videos.map(v => ({ ...v, name: v.title ?? v.filename }))
  const chartHeight = Math.max(120, data.length * 44)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }} barCategoryGap="28%">
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--text)', fontSize: 12 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={160}
          tick={{ fill: 'var(--text-h)', fontSize: 12 }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={false}
          tickFormatter={(name: string) => (name.length > 22 ? `${name.slice(0, 21)}…` : name)}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--item-hover)' }} />
        <Bar dataKey="views" radius={[0, 4, 4, 0]} maxBarSize={24} cursor="pointer">
          {data.map(v => (
            <Cell key={v.contentId} fill="var(--chart-accent)" onClick={() => onSelect(v.contentId)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

interface TooltipPayloadItem {
  payload: VideoAnalyticsSummaryDto & { name: string }
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-value">{item.views.toLocaleString()} view{item.views === 1 ? '' : 's'}</p>
      <p className="chart-tooltip-label">{item.name}</p>
      <p className="chart-tooltip-secondary">{item.completionRate.toFixed(0)}% completion</p>
    </div>
  )
}

function formatWatchTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const totalMinutes = Math.round(seconds / 60)
  if (totalMinutes < 60) return `${totalMinutes}m`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}
