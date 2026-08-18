import { createBrowserRouter, Navigate } from 'react-router'
import ProtectedRoute from './components/ProtectedRoute'
import RequireAdmin from './components/RequireAdmin'
import RootLayout from './layouts/RootLayout'
import Analytics from './pages/Analytics'
import ContentDetail from './pages/ContentDetail'
import CreateUser from './pages/CreateUser'
import Login from './pages/Login'
import MediaLibrary from './pages/MediaLibrary'
import PlaylistDetail from './pages/PlaylistDetail'
import Playlists from './pages/Playlists'
import Uploads from './pages/Uploads'
import UserDetail from './pages/UserDetail'
import Users from './pages/Users'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <MediaLibrary /> },
      { path: 'media', element: <MediaLibrary /> },
      { path: 'media/:id', element: <ContentDetail /> },
      { path: 'playlists', element: <Playlists /> },
      { path: 'playlists/:id', element: <PlaylistDetail /> },
      { path: 'uploads', element: <Uploads /> },
      { path: 'analytics', element: <RequireAdmin><Analytics /></RequireAdmin> },
      { path: 'users', element: <RequireAdmin><Users /></RequireAdmin> },
      { path: 'users/create', element: <RequireAdmin><CreateUser /></RequireAdmin> },
      { path: 'users/:id', element: <UserDetail /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default router
