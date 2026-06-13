import { createBrowserRouter } from 'react-router-dom'
import Landing from './pages/Landing'
import Features from './pages/Features'
import Docs from './pages/Docs'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import Pricing from './pages/Pricing'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Webhooks from './pages/Webhooks'
import Settings from './pages/Settings'

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/features', element: <Features /> },
  { path: '/docs', element: <Docs /> },
  { path: '/contact', element: <Contact /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/pricing', element: <Pricing /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/transactions', element: <Transactions /> },
  { path: '/webhooks', element: <Webhooks /> },
  { path: '/settings', element: <Settings /> },
])

export default router
