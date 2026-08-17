import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { deactivateUser, fetchUser, reactivateUser, type UserListItem } from '../services/userApi'
import './Users.css'

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [target, setTarget] = useState<UserListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetchUser(id).then(data => {
      if (cancelled) return
      if (data) {
        setTarget(data)
      } else {
        setError(true)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [id])

  async function handleToggle() {
    if (!id || !target) return
    setWorking(true)
    const updated = target.deactivatedAt === null ? await deactivateUser(id) : await reactivateUser(id)
    setWorking(false)
    if (updated) {
      setTarget(updated)
    }
  }

  if (loading) return <p className="media-loading">Loading…</p>
  if (error || !target) return <p className="media-error">User not found.</p>

  const isActive = target.deactivatedAt === null
  const isSelf = currentUser?.id === target.id
  const isAdminRole = target.roles.includes('ROLE_GROUP_ADMIN')

  return (
    <div className="users-page">
      <div className="users-page-header">
        <h1>{target.firstName} {target.lastName}</h1>
        <button type="button" className="btn-ghost" onClick={() => void navigate('/users')}>
          ← Back to Users
        </button>
      </div>

      <div className="user-detail-fields">
        <div className="user-detail-field">
          <span className="user-detail-label">Email</span>
          <span>{target.email}</span>
        </div>
        <div className="user-detail-field">
          <span className="user-detail-label">Role</span>
          <span className={`badge ${isAdminRole ? 'badge-category' : 'badge-pending'}`}>
            {isAdminRole ? 'Admin' : 'Editor'}
          </span>
        </div>
        <div className="user-detail-field">
          <span className="user-detail-label">Status</span>
          <span className={`badge ${isActive ? 'badge-success' : 'badge-error'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="user-detail-field">
          <span className="user-detail-label">Created</span>
          <span>{new Date(target.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {isSelf ? (
        <p className="form-hint">You cannot deactivate your own account.</p>
      ) : (
        <button
          type="button"
          className={isActive ? 'btn-delete' : 'btn-primary'}
          onClick={() => void handleToggle()}
          disabled={working}
        >
          {working ? 'Working…' : isActive ? 'Deactivate' : 'Reactivate'}
        </button>
      )}
    </div>
  )
}
