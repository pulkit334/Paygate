import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import WebhookTable from '../components/WebhookTable'
import { getDeliveries, retryDelivery } from '../services/webhooks.service'
import { RefreshCw, CheckCircle, XCircle, Clock, Activity, Download } from 'lucide-react'

const REFRESH_INTERVAL = 60 * 60 * 1000

const exportCSV = (deliveries: any[], date: string) => {
  const headers = ['Date', 'Target URL', 'Status', 'Attempt', 'HTTP Code']
  const rows = deliveries.map(d => [
    new Date(d.createdAt).toISOString(),
    d.targetUrl,
    d.status,
    d.attemptNumber,
    d.httpResponseCode,
  ])
  const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `webhook-deliveries-${date || 'all'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const Webhooks = () => {
  useAuth()
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const fetchDeliveries = useCallback(() => {
    setLoading(true)
    setError('')
    getDeliveries({ date: selectedDate })
      .then((data) => {
        setDeliveries(data)
        setLastRefreshed(new Date())
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load webhook deliveries'))
      .finally(() => setLoading(false))
  }, [selectedDate])

  useEffect(() => { fetchDeliveries() }, [fetchDeliveries])

  useEffect(() => {
    const interval = setInterval(fetchDeliveries, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchDeliveries])

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
            <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">Webhook Deliveries</h1>
            <p className="text-sm text-text-muted mt-1">
              {loading ? 'Loading...' : `${deliveries.length} deliveries logged`}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-3 sm:mt-0">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
            <button onClick={fetchDeliveries}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={() => exportCSV(deliveries, selectedDate)}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-all">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        <div className="text-xs text-text-muted mb-2 text-right">
          Auto-refreshes every 60 min · Last refreshed: {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-danger-soft border border-danger/20 rounded-md text-danger text-sm">{error}</div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface border border-border rounded-[10px] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-info-soft rounded-lg flex items-center justify-center">
                <Activity size={18} className="text-info" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Total Today</p>
                <p className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)]">{deliveries.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-[10px] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success-soft rounded-lg flex items-center justify-center">
                <CheckCircle size={18} className="text-success" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Succeeded</p>
                <p className="text-xl font-bold text-success font-[family-name:var(--font-display)]">{succeeded}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-[10px] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-danger-soft rounded-lg flex items-center justify-center">
                <XCircle size={18} className="text-danger" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Failed</p>
                <p className="text-xl font-bold text-danger font-[family-name:var(--font-display)]">{failed}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-[10px] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning-soft rounded-lg flex items-center justify-center">
                <Clock size={18} className="text-warning" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Total Attempts</p>
                <p className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)]">{totalAttempts}</p>
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
