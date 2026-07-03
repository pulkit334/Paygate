/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { fetchApiKeys, createApiKey, deleteApiKey, clearNewlyCreatedKey } from '../toolkit/user-redux-toll/user-redux'
import Navbar from '../components/Navbar'
import ProviderConnect from '../components/ProviderConnect'
import SecretKeyModal from '../components/SecretKeyModal'
import ApiKeysPanel from '../components/ApiKeysPanel'
import { getSettings, rotateKeys, updateCallbackUrl } from '../services/settings.service'
import { Key, Link, AlertTriangle, Copy, Check, Shield, RefreshCw, CreditCard, User, Webhook } from 'lucide-react'

type Tab = 'profile' | 'providers' | 'api-keys' | 'webhooks' | 'security'

const tabs: { id: Tab; label: string; icon: typeof Key }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'providers', label: 'Payment Providers', icon: CreditCard },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'security', label: 'Security', icon: Shield },
]

const Settings = () => {
  const dispatch = useDispatch()
  const { apiKeys, loading: keysLoading, newlyCreatedKey } = useSelector((state: RootState) => state.user)
  const [activeTab, setActiveTab] = useState<Tab>('providers')

  const [publicKey, setPublicKey] = useState('')
  const [callbackUrl, setCallbackUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newCallbackUrl, setNewCallbackUrl] = useState('')
  const [showRotateConfirm, setShowRotateConfirm] = useState(false)
  const [newKeys, setNewKeys] = useState<{ publicKey: string; secretKey: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    dispatch(fetchApiKeys() as any)
    getSettings()
      .then((data) => {
        setCallbackUrl(data.callbackUrl)
        setNewCallbackUrl(data.callbackUrl)
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load settings'))
      .finally(() => setLoading(false))
  }, [dispatch])

  useEffect(() => {
    if (apiKeys.length > 0 && apiKeys[0].publicKey) {
      setPublicKey(apiKeys[0].publicKey)
    }
  }, [apiKeys])

  const handleUpdateCallback = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateCallbackUrl(newCallbackUrl)
      setCallbackUrl(newCallbackUrl)
      setSuccess('Webhook URL updated successfully')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update webhook URL')
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
    return <SecretKeyModal publicKey={newKeys.publicKey} onSaved={() => setNewKeys(null)} />
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">Settings</h1>
          <p className="text-sm text-text-muted mt-1">Manage your account, providers, and integration settings</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-danger-soft border border-danger/20 rounded-md text-danger text-sm flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-success-soft border border-success/20 rounded-md text-success text-sm flex items-center gap-2">
            <Check size={14} /> {success}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <nav className="bg-surface border border-border rounded-[10px] p-2 lg:sticky lg:top-24">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setError(''); setSuccess('') }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === id
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-black/[0.03]'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* Profile */}
            {activeTab === 'profile' && (
              <div className="bg-surface border border-border rounded-[10px] p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-1">Profile</h2>
                <p className="text-sm text-text-muted mb-6">Your account information</p>
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-xs text-text-muted block mb-1.5">Email</label>
                    <code className="block w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-sm font-mono text-text-primary">
                      developer@example.com
                    </code>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1.5">Plan</label>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 px-4 py-3 bg-bg-primary border border-border rounded-lg text-sm font-mono text-text-primary">
                        Starter (Free)
                      </code>
                      <button className="px-4 py-2.5 text-sm font-medium text-accent border border-accent/30 rounded-lg hover:bg-accent/5 transition-all whitespace-nowrap">
                        Upgrade
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Providers */}
            {activeTab === 'providers' && (
              <div className="bg-surface border border-border rounded-[10px] p-6">
                <ProviderConnect />
              </div>
            )}

            {/* API Keys */}
            {activeTab === 'api-keys' && (
              <ApiKeysPanel
                keys={apiKeys.map((k: any) => ({
                  id: k._id || k.id || '',
                  name: k.name || 'API Key',
                  maskedKey: k.publicKey || '',
                  createdAt: k.createdAt || new Date().toISOString(),
                  expiresAt: k.expiresAt || null,
                  isActive: k.isActive !== false,
                }))}
                onCreateKey={(name, expiresAt) => {
                  dispatch(createApiKey({ name, expiresAt }) as any)
                }}
                onDeleteKey={(keyId) => {
                  dispatch(deleteApiKey(keyId) as any)
                }}
                isLoading={keysLoading}
                newlyCreatedKey={newlyCreatedKey}
                onDismissNewKey={() => dispatch(clearNewlyCreatedKey())}
              />
            )}

            {/* Webhooks */}
            {activeTab === 'webhooks' && (
              <div className="bg-surface border border-border rounded-[10px] p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-1">Webhook URL</h2>
                <p className="text-sm text-text-muted mb-6">Where payment events are sent</p>

                {loading ? (
                  <div className="animate-pulse h-32 bg-bg-elevated rounded-lg" />
                ) : (
                  <div className="space-y-4 max-w-lg">
                    <div>
                      <label className="text-xs text-text-muted block mb-1.5">Current URL</label>
                      <code className="block w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-sm font-mono text-text-primary">
                        {callbackUrl || <span className="text-text-muted italic">Not configured</span>}
                      </code>
                    </div>

                    <form onSubmit={handleUpdateCallback}>
                      <label className="text-xs text-text-muted block mb-1.5">Update URL</label>
                      <div className="flex gap-3">
                        <input type="url" value={newCallbackUrl} onChange={(e) => setNewCallbackUrl(e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-sm"
                          placeholder="https://api.myapp.com/webhooks/paygate" />
                        <button type="submit" disabled={saving}
                          className="px-6 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg font-medium transition-all text-sm whitespace-nowrap">
                          {saving ? 'Saving...' : 'Update'}
                        </button>
                      </div>
                    </form>

                    <div className="bg-info-soft border border-info/20 rounded-lg px-4 py-3">
                      <p className="text-xs text-info font-medium">How webhooks work</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        PayGate sends POST requests to your URL when payment events occur.
                        Each request includes an HMAC-SHA256 signature for verification.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="bg-surface border border-border rounded-[10px] p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-1">Security</h2>
                <p className="text-sm text-text-muted mb-6">Authentication and access controls</p>

                <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
                  {[
                    { label: 'JWT Authentication', value: 'Enabled', color: 'text-success', bg: 'bg-success-soft' },
                    { label: 'API Key Auth', value: 'Active', color: 'text-success', bg: 'bg-success-soft' },
                    { label: 'Rate Limiting', value: '100 req/min', color: 'text-success', bg: 'bg-success-soft' },
                    { label: 'Webhook Signing', value: 'HMAC-SHA256', color: 'text-success', bg: 'bg-success-soft' },
                    { label: 'Encryption at Rest', value: 'AES-256', color: 'text-success', bg: 'bg-success-soft' },
                    { label: 'Idempotency', value: 'Enabled', color: 'text-success', bg: 'bg-success-soft' },
                  ].map((item) => (
                    <div key={item.label} className="bg-bg-primary border border-border rounded-lg p-4">
                      <div className="text-xs text-text-muted mb-1">{item.label}</div>
                      <div className={`text-sm font-semibold ${item.color}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {showRotateConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-[10px] max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-danger-soft rounded-full">
                <AlertTriangle size={20} className="text-danger" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Rotate API Keys?</h3>
                <p className="text-sm text-text-muted mt-1">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              Current keys will <span className="text-danger font-medium">stop working immediately</span>.
              Any services using the old keys will need to be updated.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowRotateConfirm(false)}
                className="px-5 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-black/[0.03] transition-all">
                Cancel
              </button>
              <button onClick={handleRotate}
                className="px-5 py-2.5 text-sm font-medium text-white bg-danger hover:bg-red-600 rounded-lg transition-all">
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
