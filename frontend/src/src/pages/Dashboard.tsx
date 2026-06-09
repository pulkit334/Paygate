import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import SummaryCard from '../components/SummaryCard'
import TransactionTable from '../components/TransactionTable'
import { getSummary, getDailyVolume } from '../api/analytics'
import { getPayments } from '../api/payments'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { IndianRupee, Activity, CheckCircle, Clock, TrendingUp, ArrowUpRight, Wallet } from 'lucide-react'

const Dashboard = () => {
  useAuth()
  const [summary, setSummary] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [dailyVolume, setDailyVolume] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getSummary().catch(() => null),
      getPayments({ limit: 10 }).catch(() => ({ payments: [] })),
      getDailyVolume(7).catch(() => []),
    ])
      .then(([s, p, d]) => {
        setSummary(s)
        setPayments(p.payments)
        setDailyVolume(d)
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [])

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-sm text-text-muted mt-1">Welcome back, JioMart team</p>
          </div>
          <div className="flex items-center gap-3 mt-3 sm:mt-0">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
              <TrendingUp size={16} />
              <span className="font-medium">+12.5% this month</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
        )}

        {loading ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-surface border border-border rounded-xl p-5 animate-pulse h-24" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-surface border border-border rounded-xl p-6 animate-pulse h-64" />
              <div className="bg-surface border border-border rounded-xl p-6 animate-pulse h-64" />
            </div>
          </>
        ) : (
          <>
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <SummaryCard label="Total Volume" value={formatAmount(summary.totalReceived)} icon={<IndianRupee size={20} />} />
                <SummaryCard label="Total Transactions" value={summary.totalTransactions.toLocaleString('en-IN')} icon={<Activity size={20} />} />
                <SummaryCard label="Success Rate" value={`${summary.successRate}%`} icon={<CheckCircle size={20} />} />
                <SummaryCard label="Last Payment" value={summary.lastPaymentAt ? new Date(summary.lastPaymentAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'} icon={<Clock size={20} />} />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Recent Transactions</h2>
                  <span className="text-xs text-accent flex items-center gap-1 cursor-pointer hover:underline">
                    View all <ArrowUpRight size={12} />
                  </span>
                </div>
                <TransactionTable payments={payments} loading={false} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Daily Volume</h2>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    Last 7 days
                  </div>
                </div>
                <div className="bg-surface border border-border rounded-xl p-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dailyVolume}>
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                        formatter={(value) => [formatAmount(value as number), 'Volume']}
                      />
                      <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-6 glass rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Wallet size={18} className="text-accent" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Wallet Balance</p>
                  <p className="text-lg font-bold text-text-primary">{formatAmount(0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp size={18} className="text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Settlements Pending</p>
                  <p className="text-lg font-bold text-text-primary">{formatAmount(0)}</p>
                </div>
              </div>
              <div className="text-xs text-text-muted">
                Last updated: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Dashboard
