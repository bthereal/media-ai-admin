import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import BrandLogo from '../components/BrandLogo'
import SearchPanel from '../components/SearchPanel/SearchPanel'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
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
        <Link to="/" className="sidebar-logo">
          <BrandLogo />
          <span>YouFlix</span>
        </Link>
        <ul className="nav-links">
          <li>
            <NavLink to="/" end onClick={() => setSearchOpen(false)}>
              <HomeIcon />
              <span>Home</span>
            </NavLink>
          </li>
          <li>
            <button type="button" className="nav-link-btn" onClick={() => setSearchOpen(true)}>
              <SearchIcon />
              <span>Search</span>
            </button>
          </li>
          <li>
            <NavLink to="/playlists" onClick={() => setSearchOpen(false)}>
              <PlaylistIcon />
              <span>My Playlists</span>
            </NavLink>
          </li>
          {isAdmin && (
            <>
              <li>
                <NavLink to="/analytics" onClick={() => setSearchOpen(false)}>
                  <AnalyticsIcon />
                  <span>Analytics</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/users" onClick={() => setSearchOpen(false)}>
                  <UsersIcon />
                  <span>Users</span>
                </NavLink>
              </li>
            </>
          )}
        </ul>
        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user-row">
              <Link to={`/users/${user.id}`} className="sidebar-user" title="View your profile">
                {user.firstName} {user.lastName}
              </Link>
              <Link to={`/users/${user.id}`} className="sidebar-settings-link" title="Account settings" aria-label="Account settings">
                <CogIcon />
              </Link>
            </div>
          )}
          <div className="sidebar-footer-row">
            <button className="sidebar-logout" type="button" onClick={handleLogout}>
              Sign out
            </button>
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <main className="content">
        <Outlet />
      </main>
      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function CogIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5v2.1m0 12.8v2.1m8.5-8.5h-2.1M5.6 12H3.5m14.44-6.14-1.49 1.49M7.55 16.55l-1.49 1.49m0-11.98 1.49 1.49m9.9 9.9 1.49 1.49" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2.5v2.5M12 19v2.5M4.5 12H2M22 12h-2.5M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7Z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  )
}

function PlaylistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <circle cx="4.5" cy="6" r="1.25" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" d="M8 6h12" />
      <circle cx="4.5" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" d="M8 12h12" />
      <circle cx="4.5" cy="18" r="1.25" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" d="M8 18h12" />
    </svg>
  )
}

function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <rect x="4" y="12" width="4" height="8" rx="1" />
      <rect x="10" y="8" width="4" height="12" rx="1" />
      <rect x="16" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <circle cx="9" cy="7.5" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 20c0-3.6 2.9-6.25 6.5-6.25s6.5 2.65 6.5 6.25" />
      <circle cx="17" cy="8.5" r="2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.25 13.85c2.65.4 4.75 2.6 4.75 6.15" />
    </svg>
  )
}
