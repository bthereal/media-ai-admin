import { Navigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div style={{ padding: 32, color: 'var(--text)' }}>Loading…</div>
  }

  if (!user?.roles.includes('ROLE_GROUP_ADMIN')) {
    return <Navigate to="/media" replace />
  }

  return <>{children}</>
}
