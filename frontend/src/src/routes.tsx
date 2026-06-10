import { createBrowserRouter } from 'react-router-dom'
import Landing from './pages/Landing'
import Features from './pages/Features'
import Pricing from './pages/Pricing'
import Docs from './pages/Docs'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Webhooks from './pages/Webhooks'
import Settings from './pages/Settings'

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/features', element: <Features /> },
  { path: '/pricing', element: <Pricing /> },
  { path: '/docs', element: <Docs /> },
  { path: '/register', element: <Register /> },
  { path: '/login', element: <Login /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/transactions', element: <Transactions /> },
  { path: '/webhooks', element: <Webhooks /> },
  { path: '/settings', element: <Settings /> },
])

export default router
