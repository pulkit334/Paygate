import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Payment } from '../api/payments'

interface TransactionTableProps {
  payments: Payment[]
  loading: boolean
}

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    paid: 'bg-green-500/10 text-green-400 border-green-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    refunded: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
      {status}
    </span>
  )
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
}

const TransactionTable = ({ payments, loading }: TransactionTableProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-slate-700/50 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs uppercase tracking-wider">Amount</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs uppercase tracking-wider">Customer</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-text-primary">{formatDate(payment.createdAt)}</td>
                <td className="px-4 py-3 text-text-primary font-medium">{formatAmount(payment.amount)}</td>
                <td className="px-4 py-3">{statusBadge(payment.status)}</td>
                <td className="px-4 py-3 text-text-secondary">{payment.customerEmail}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setExpandedId(expandedId === payment.id ? null : payment.id)}
                    className="text-text-muted hover:text-text-primary transition-colors"
                  >
                    {expandedId === payment.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {payments.map((payment) => (
        expandedId === payment.id && (
          <div key={`detail-${payment.id}`} className="border-t border-border bg-slate-800/50 px-6 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-text-muted">Transaction ID:</span>
                <span className="ml-2 text-text-primary font-mono text-xs">{payment.transactionId}</span>
              </div>
              <div>
                <span className="text-text-muted">Razorpay Order ID:</span>
                <span className="ml-2 text-text-primary font-mono text-xs">{payment.razorpayOrderId}</span>
              </div>
              {payment.failureReason && (
                <div className="col-span-2">
                  <span className="text-text-muted">Failure Reason:</span>
                  <span className="ml-2 text-red-400">{payment.failureReason}</span>
                </div>
              )}
              {payment.metadata && Object.keys(payment.metadata).length > 0 && (
                <div className="col-span-2">
                  <span className="text-text-muted">Metadata:</span>
                  <pre className="mt-1 text-text-secondary font-mono text-xs bg-slate-900/50 p-2 rounded">
                    {JSON.stringify(payment.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )
      ))}
    </div>
  )
}

export default TransactionTable
