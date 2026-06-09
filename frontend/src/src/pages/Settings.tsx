import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import SecretKeyModal from '../components/SecretKeyModal'
import { getSettings, rotateKeys, updateCallbackUrl } from '../api/settings'
import { Eye, EyeOff, Key, Link, AlertTriangle, Copy, Check, Shield, RefreshCw } from 'lucide-react'

const Settings = () => {
  useAuth()
  const [publicKey, setPublicKey] = useState('')
  const [callbackUrl, setCallbackUrl] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newCallbackUrl, setNewCallbackUrl] = useState('')
  const [showRotateConfirm, setShowRotateConfirm] = useState(false)
  const [newKeys, setNewKeys] = useState<{ publicKey: string; secretKey: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getSettings()
      .then((data) => {
        setPublicKey(data.publicKey)
        setCallbackUrl(data.callbackUrl)
        setNewCallbackUrl(data.callbackUrl)
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const handleUpdateCallback = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateCallbackUrl(newCallbackUrl)
      setCallbackUrl(newCallbackUrl)
      setSuccess('Callback URL updated successfully')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update callback URL')
    } finally {
      setSaving(false)
    }
  }

  const handleRotate = async () => {
    setShowRotateConfirm(false)
    setError('')
    try {
      const result = await rotateKeys()
      setNewKeys({ publicKey: result.publicKey, secretKey: result.secretKey })
      setPublicKey(result.publicKey)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Key rotation failed')
    }
  }

  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (newKeys) {
    return <SecretKeyModal publicKey={newKeys.publicKey} secretKey={newKeys.secretKey} onSaved={() => setNewKeys(null)} />
  }

  const secretMasked = `sk_live_${'•'.repeat(16)}`

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-sm text-text-muted mt-1">Manage your API keys and application configuration</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-2">
            <Check size={14} /> {success}
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-xl p-6 animate-pulse h-48" />
            <div className="bg-surface border border-border rounded-xl p-6 animate-pulse h-40" />
          </div>
        ) : (
          <>
            <div className="glass rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Key size={18} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">API Keys</h2>
                  <p className="text-sm text-text-muted">Your API credentials for authenticating requests</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-muted block mb-1.5">Public Key</label>
                  <div className="flex items-center bg-slate-900 border border-border/50 rounded-xl overflow-hidden group">
                    <code className="flex-1 px-4 py-3 text-sm font-mono text-text-primary">{publicKey}</code>
                    <button onClick={() => copyKey(publicKey)}
                      className="px-4 py-3 border-l border-border/50 text-text-muted hover:text-text-primary hover:bg-white/5 transition-all">
                      {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-muted block mb-1.5">Secret Key</label>
                  <div className="flex items-center bg-slate-900 border border-border/50 rounded-xl overflow-hidden">
                    <code className="flex-1 px-4 py-3 text-sm font-mono text-text-primary">
                      {showSecret ? secretMasked : 'sk_live_••••••••'}
                    </code>
                    <button onClick={() => setShowSecret(!showSecret)}
                      className="px-4 py-3 border-l border-border/50 text-text-muted hover:text-text-primary hover:bg-white/5 transition-all">
                      {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button onClick={() => setShowRotateConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-xl hover:bg-yellow-500/20 transition-all">
                  <RefreshCw size={14} /> Rotate Keys
                </button>
              </div>
            </div>

            <div className="glass rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Link size={18} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Callback URL</h2>
                  <p className="text-sm text-text-muted">Webhook events will be sent to this URL</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs text-text-muted block mb-1.5">Current URL</label>
                <code className="block w-full px-4 py-3 bg-slate-900 border border-border/50 rounded-xl text-sm font-mono text-text-primary">
                  {callbackUrl || <span className="text-text-muted italic">Not configured</span>}
                </code>
              </div>

              <form onSubmit={handleUpdateCallback}>
                <label className="text-xs text-text-muted block mb-1.5">New URL</label>
                <div className="flex gap-3">
                  <input type="url" value={newCallbackUrl} onChange={(e) => setNewCallbackUrl(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-border/50 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors text-sm"
                    placeholder="https://api.myapp.com/webhooks/paygate" />
                  <button type="submit" disabled={saving}
                    className="px-6 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-xl font-medium transition-all text-sm whitespace-nowrap">
                    {saving ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <Shield size={18} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Security Summary</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'JWT Auth', value: 'Enabled', status: 'success' },
                  { label: 'API Key Auth', value: 'Active', status: 'success' },
                  { label: 'Rate Limiting', value: '100 req/min', status: 'success' },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-900/50 border border-border/30 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-sm text-text-muted">{item.label}</span>
                    <span className={`text-sm font-medium ${
                      item.status === 'success' ? 'text-green-400' : 'text-yellow-400'
                    }`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {showRotateConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Rotate API Keys?</h3>
                <p className="text-sm text-text-muted mt-1">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              Current keys will <span className="text-red-400 font-medium">stop working immediately</span>.
              Any services using the old keys will need to be updated. Make sure you update all
              your apps before rotating.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowRotateConfirm(false)}
                className="px-5 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-xl hover:bg-white/5 transition-all">
                Cancel
              </button>
              <button onClick={handleRotate}
                className="px-5 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-lg shadow-red-500/20">
                Rotate Keys
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
