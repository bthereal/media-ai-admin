import { NavLink, Outlet } from 'react-router'
import './RootLayout.css'

export default function RootLayout() {
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
        </ul>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
