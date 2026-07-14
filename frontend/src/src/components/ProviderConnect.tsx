import { useState, useEffect } from 'react'
import { Check, Eye, EyeOff, X, Plug, Loader2 } from 'lucide-react'
import {
  getProviderKeys,
  saveProviderKey,
  deleteProviderKey,
  type ProviderKey,
} from '../services/provider-keys.service'

interface ProviderConfig {
  id: string
  name: string
  icon: string
  color: string
  keyPlaceholder: string
  keyLabel: string
  secretLabel: string
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'razorpay',
    name: 'Razorpay',
    icon: 'R',
    color: '#072654',
    keyPlaceholder: 'rzp_test_...',
    keyLabel: 'Key ID',
    secretLabel: 'Key Secret',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: 'S',
    color: '#635BFF',
    keyPlaceholder: 'pk_live_...',
    keyLabel: 'Publishable Key',
    secretLabel: 'Secret Key',
  },
]

const ProviderConnect = () => {
  const [connected, setConnected] = useState<Record<string, ProviderKey>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [keyId, setKeyId] = useState('')
  const [keySecret, setKeySecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    getProviderKeys()
      .then((keys) => {
        const map: Record<string, ProviderKey> = {}
        keys.forEach((k) => { map[k.provider] = k })
        setConnected(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleConnect = (provider: ProviderConfig) => {
    setEditing(provider.id)
    setKeyId(connected[provider.id]?.keyId || '')
    setKeySecret('')
    setShowSecret(false)
    setVerifyStatus('idle')
  }

  const handleDisconnect = async (id: string) => {
    try {
      await deleteProviderKey(id)
      setConnected((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch {}
  }

  const handleSave = async () => {
    if (!editing || !keyId || !keySecret) return
    setSaving(true)
    setVerifyStatus('idle')

    try {
      await saveProviderKey({ provider: editing, keyId, keySecret })
      setVerifyStatus('success')

      const keys = await getProviderKeys()
      const map: Record<string, ProviderKey> = {}
      keys.forEach((k) => { map[k.provider] = k })
      setConnected(map)

      setTimeout(() => {
        setEditing(null)
        setVerifyStatus('idle')
      }, 1200)
    } catch {
      setVerifyStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const activeProvider = PROVIDERS.find((p) => p.id === editing)

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-info-soft rounded-lg flex items-center justify-center">
            <Plug size={18} className="text-info" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Payment Providers</h2>
            <p className="text-sm text-text-muted">Connect your Razorpay, Stripe, or other provider accounts</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-[10px] p-5 animate-pulse h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-info-soft rounded-lg flex items-center justify-center">
          <Plug size={18} className="text-info" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Payment Providers</h2>
          <p className="text-sm text-text-muted">Connect your Razorpay, Stripe, or other provider accounts</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {PROVIDERS.map((provider) => {
          const isConnected = !!connected[provider.id]
          return (
            <div
              key={provider.id}
              className={`relative border rounded-[10px] p-5 transition-all ${
                isConnected
                  ? 'bg-surface border-success/30 hover:border-success/50'
                  : 'bg-surface border-border hover:border-border-accent cursor-pointer'
              }`}
              onClick={() => !isConnected && handleConnect(provider)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: provider.color }}
                  >
                    {provider.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{provider.name}</div>
                    <div className="text-xs text-text-muted">
                      {isConnected ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                </div>
                {isConnected && (
                  <div className="w-6 h-6 bg-success-soft rounded-full flex items-center justify-center">
                    <Check size={14} className="text-success" />
                  </div>
                )}
              </div>

              {isConnected && (
                <div className="space-y-2">
                  <div className="bg-bg-primary border border-border rounded-lg px-3 py-2">
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Key ID</div>
                    <code className="text-xs font-mono text-text-primary">{connected[provider.id].keyId}</code>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleConnect(provider)
                      }}
                      className="flex-1 px-3 py-2 text-xs font-medium text-text-secondary border border-border rounded-lg hover:bg-black/[0.03] transition-all"
                    >
                      Update
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDisconnect(provider.id)
                      }}
                      className="px-3 py-2 text-xs font-medium text-danger border border-danger/20 rounded-lg hover:bg-danger-soft transition-all"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )}

              {!isConnected && (
                <div className="text-xs text-accent font-medium mt-1">
                  Click to connect →
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editing && activeProvider && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-[10px] max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: activeProvider.color }}
                >
                  {activeProvider.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">Connect {activeProvider.name}</h3>
                  <p className="text-xs text-text-muted">Enter your {activeProvider.name} API credentials</p>
                </div>
              </div>
              <button onClick={() => setEditing(null)} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block">{activeProvider.keyLabel}</label>
                <input
                  type="text"
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  placeholder={activeProvider.keyPlaceholder}
                  className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block">{activeProvider.secretLabel}</label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={keySecret}
                    onChange={(e) => setKeySecret(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full px-4 py-2.5 pr-10 bg-bg-primary border border-border rounded-lg text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  >
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="bg-warning-soft border border-warning/20 rounded-lg px-4 py-3">
                <p className="text-xs text-warning font-medium">Security note</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Your keys are encrypted and stored securely. They are never exposed in API responses or the dashboard.
                </p>
              </div>

              {verifyStatus === 'success' && (
                <div className="bg-success-soft border border-success/20 rounded-lg px-4 py-3 text-sm text-success flex items-center gap-2">
                  <Check size={14} /> Connected successfully
                </div>
              )}

              {verifyStatus === 'error' && (
                <div className="bg-danger-soft border border-danger/20 rounded-lg px-4 py-3 text-sm text-danger flex items-center gap-2">
                  <X size={14} /> Invalid credentials. Please check and try again.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-black/[0.03] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!keyId || !keySecret || saving}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-50 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Verifying...' : 'Save & Connect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProviderConnect
