import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Payment } from '../services/payments.service'

interface TransactionTableProps {
  payments: Payment[]
  loading: boolean
}

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    paid: 'bg-success-soft text-success border-success/20',
    failed: 'bg-danger-soft text-danger border-danger/20',
    refunded: 'bg-warning-soft text-warning border-warning/20',
    pending: 'bg-warning-soft text-warning border-warning/20',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${styles[status] || 'bg-black/5 text-text-muted border-border'}`}>
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
      <div className="bg-surface border border-border rounded-[10px] p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-bg-elevated rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
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
              <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-bg-elevated/50 transition-colors">
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
            {payments?.length === 0 && (
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
          <div key={`detail-${payment.id}`} className="border-t border-border bg-bg-elevated/50 px-6 py-4">
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
                  <span className="ml-2 text-danger">{payment.failureReason}</span>
                </div>
              )}
              {payment.metadata && Object.keys(payment.metadata)?.length > 0 && (
                <div className="col-span-2">
                  <span className="text-text-muted">Metadata:</span>
                  <pre className="mt-1 text-text-secondary font-mono text-xs bg-bg-primary p-2 rounded border border-border">
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
