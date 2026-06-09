import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import WebhookTable from '../components/WebhookTable'
import { getDeliveries, retryDelivery } from '../api/webhooks'
import { RefreshCw, CheckCircle, XCircle, Clock, Activity } from 'lucide-react'

const Webhooks = () => {
  useAuth()
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const fetchDeliveries = () => {
    setLoading(true)
    setError('')
    getDeliveries()
      .then(setDeliveries)
      .catch((err) => setError(err.response?.data?.error || 'Failed to load webhook deliveries'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDeliveries() }, [])

  const handleRetry = async (id: string) => {
    setRetryingId(id)
    try {
      await retryDelivery(id)
      fetchDeliveries()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Retry failed')
    } finally {
      setRetryingId(null)
    }
  }

  const succeeded = deliveries.filter(d => d.status === 'success' || d.status === 'delivered').length
  const failed = deliveries.filter(d => d.status === 'failed').length
  const totalAttempts = deliveries.reduce((sum, d) => sum + d.attemptNumber, 0)

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Webhook Deliveries</h1>
            <p className="text-sm text-text-muted mt-1">
              {loading ? 'Loading...' : `${deliveries.length} deliveries logged`}
            </p>
          </div>
          <button onClick={fetchDeliveries}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all mt-3 sm:mt-0">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Activity size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Total</p>
                <p className="text-xl font-bold text-text-primary">{deliveries.length}</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle size={18} className="text-green-400" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Succeeded</p>
                <p className="text-xl font-bold text-green-400">{succeeded}</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <XCircle size={18} className="text-red-400" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Failed</p>
                <p className="text-xl font-bold text-red-400">{failed}</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Clock size={18} className="text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Total Attempts</p>
                <p className="text-xl font-bold text-text-primary">{totalAttempts}</p>
              </div>
            </div>
          </div>
        </div>

        <WebhookTable deliveries={deliveries} loading={loading} onRetry={handleRetry} retryingId={retryingId} />
      </main>
    </div>
  )
}

export default Webhooks
