import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import './RootLayout.css'

export default function RootLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    void navigate('/login', { replace: true })
  }

  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <span>Content Admin</span>
        </div>
        <ul className="nav-links">
          <li>
            <NavLink to="/" end>Dashboard</NavLink>
          </li>
          <li>
            <NavLink to="/media">Media Library</NavLink>
          </li>
          <li>
            <NavLink to="/uploads">Uploads</NavLink>
          </li>
          <li>
            <NavLink to="/users/create">Create User</NavLink>
          </li>
        </ul>
        <div className="sidebar-footer">
          {user && (
            <p className="sidebar-user">{user.firstName} {user.lastName}</p>
          )}
          <button className="sidebar-logout" type="button" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
