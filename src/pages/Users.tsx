import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { fetchUsers, type UserListItem } from '../services/userApi'
import './Users.css'

export default function Users() {
  const [users, setUsers] = useState<UserListItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchUsers().then(data => {
      if (cancelled) return
      if (data) {
        setUsers(data)
      } else {
        setError(true)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="users-page">
      <div className="users-page-header">
        <h1>Users</h1>
        <Link to="/users/create" className="btn-upload">Create User</Link>
      </div>

      {loading && <p className="media-loading">Loading…</p>}
      {error && !loading && <p className="media-error">Failed to load users. Is the API running?</p>}

      {!loading && !error && users && (
        users.length === 0 ? (
          <p className="media-empty">No users found.</p>
        ) : (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><Link to={`/users/${u.id}`}>{u.firstName} {u.lastName}</Link></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.roles.includes('ROLE_GROUP_ADMIN') ? 'badge-category' : 'badge-pending'}`}>
                        {u.roles.includes('ROLE_GROUP_ADMIN') ? 'Admin' : 'Editor'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.deactivatedAt === null ? 'badge-success' : 'badge-error'}`}>
                        {u.deactivatedAt === null ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
