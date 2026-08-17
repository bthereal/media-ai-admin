import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import SearchPanel from '../components/SearchPanel/SearchPanel'
import { useAuth } from '../contexts/AuthContext'
import './RootLayout.css'

export default function RootLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const isAdmin = user?.roles.includes('ROLE_GROUP_ADMIN') ?? false

  function handleLogout() {
    logout()
    void navigate('/login', { replace: true })
  }

  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <span>Content Admin</span>
          <button
            type="button"
            className="sidebar-search-btn"
            onClick={() => setSearchOpen(true)}
            aria-label="Search videos"
            title="Search"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
            </svg>
          </button>
        </div>
        <ul className="nav-links">
          <li>
            <NavLink to="/" end>Dashboard</NavLink>
          </li>
          <li>
            <NavLink to="/media">Media Library</NavLink>
          </li>
          <li>
            <NavLink to="/playlists">Playlists</NavLink>
          </li>
          {isAdmin && (
            <li>
              <NavLink to="/users">Users</NavLink>
            </li>
          )}
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
      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
