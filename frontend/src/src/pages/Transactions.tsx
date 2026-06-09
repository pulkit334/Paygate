import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import TransactionTable from '../components/TransactionTable'
import { getPayments } from '../api/payments'
import { Search, Download, RefreshCw, Filter, X } from 'lucide-react'

const statusOptions = ['all', 'paid', 'failed', 'refunded', 'pending']

const Transactions = () => {
  useAuth()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const fetchPayments = () => {
    setLoading(true)
    setError('')
    const params: Record<string, string> = {}
    if (status !== 'all') params.status = status
    if (fromDate) params.from = fromDate
    if (toDate) params.to = toDate
    if (searchQuery) params.search = searchQuery
    getPayments(params)
      .then((res) => setPayments(res.payments))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load transactions'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPayments() }, [])

  const clearFilters = () => {
    setStatus('all')
    setFromDate('')
    setToDate('')
    setSearchQuery('')
    fetchPayments()
  }

  const hasFilters = status !== 'all' || fromDate || toDate || searchQuery

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Transactions</h1>
            <p className="text-sm text-text-muted mt-1">
              {loading ? 'Loading...' : `${payments.length} transactions found`}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-3 sm:mt-0">
            <button onClick={() => fetchPayments()}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-all">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
        )}

        <div className="glass rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-slate-900/50 border border-border/50 rounded-xl px-3 py-2">
              <Search size={14} className="text-text-muted shrink-0" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by transaction ID, email..."
                className="bg-transparent border-0 text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-text-muted hover:text-text-primary">
                  <X size={14} />
                </button>
              )}
            </div>

            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                showFilters || hasFilters
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-surface border-border/50 text-text-secondary hover:text-text-primary'
              }`}>
              <Filter size={14} /> Filters {hasFilters && <span className="w-2 h-2 rounded-full bg-accent" />}
            </button>

            {hasFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-muted hover:text-text-secondary transition-colors">
                <X size={12} /> Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border/30">
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="bg-slate-900 border border-border/50 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent">
                  {statusOptions.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted">From</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                  className="bg-slate-900 border border-border/50 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted">To</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                  className="bg-slate-900 border border-border/50 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
              </div>
              <button onClick={fetchPayments}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-all">
                Apply
              </button>
            </div>
          )}
        </div>

        <TransactionTable payments={payments} loading={loading} />
      </main>
    </div>
  )
}

export default Transactions
