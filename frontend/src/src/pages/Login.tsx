import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { login } from '../services/auth.service'
import { fetchSession } from '../toolkit/user-redux-toll/user-redux'

const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

const handleSubmit = async (e: React.SyntheticEvent) => {
  e.preventDefault();
  setLoading(true)
  setError('')
  try {
    await login({ email, password })
    // Session cookie is set automatically by the browser
    // Fetch session data into Redux
    await dispatch(fetchSession())
    navigate('/dashboard')
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : 'Login failed')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-text-primary rotate-45 rounded-sm" />
            <span className="relative text-white font-bold text-lg font-[family-name:var(--font-display)]">P</span>
          </div>
          <span className="text-2xl font-bold text-text-primary tracking-tight font-[family-name:var(--font-display)]">PayGate</span>
        </Link>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h1 className="text-xl font-bold text-text-primary mb-1">Sign in</h1>
          <p className="text-sm text-text-muted mb-6">Access your payment dashboard</p>

          {error && (
            <div className="mb-4 p-3 bg-danger-soft border border-danger/20 rounded-lg text-sm text-danger">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-all" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-sm text-text-muted text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:underline font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
