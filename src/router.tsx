import { createBrowserRouter } from 'react-router'
import RootLayout from './layouts/RootLayout'
import ContentDetail from './pages/ContentDetail'
import Dashboard from './pages/Dashboard'
import MediaLibrary from './pages/MediaLibrary'
import Uploads from './pages/Uploads'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'media', element: <MediaLibrary /> },
      { path: 'media/:id', element: <ContentDetail /> },
      { path: 'uploads', element: <Uploads /> },
    ],
  },
])

export default router
