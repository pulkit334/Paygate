import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import SecretKeyModal from '../components/SecretKeyModal'
import { ArrowLeft } from 'lucide-react'

const Register = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [callbackUrl, setCallbackUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [keys, setKeys] = useState<{ publicKey: string; secretKey: string } | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await register({ name, email, password, callbackUrl: callbackUrl || undefined })
      setKeys({ publicKey: result.publicKey, secretKey: result.secretKey })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (keys) {
    return (
      <SecretKeyModal
        publicKey={keys.publicKey}
        secretKey={keys.secretKey}
        onSaved={() => navigate('/login')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Create your account</h1>
          <p className="text-text-secondary mb-6">Register your app on PayGate</p>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Company Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full px-4 py-2.5 bg-slate-900 border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors" placeholder="Acme Corp" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-2.5 bg-slate-900 border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors" placeholder="admin@acme.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                className="w-full px-4 py-2.5 bg-slate-900 border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors" placeholder="Min 8 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Callback URL <span className="text-text-muted">(optional)</span></label>
              <input type="url" value={callbackUrl} onChange={(e) => setCallbackUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors" placeholder="https://api.acme.com/webhook" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full px-6 py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg font-medium transition-colors">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account? <Link to="/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
