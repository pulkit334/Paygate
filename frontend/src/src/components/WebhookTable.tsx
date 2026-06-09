import type { WebhookDelivery } from '../api/webhooks'
import { RotateCw } from 'lucide-react'

interface WebhookTableProps {
  deliveries: WebhookDelivery[]
  loading: boolean
  onRetry: (id: string) => void
  retryingId: string | null
}

const statusBadge = (status: string) => {
  const isSuccess = status === 'success' || status === 'delivered'
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
      isSuccess
        ? 'bg-green-500/10 text-green-400 border-green-500/20'
        : 'bg-red-500/10 text-red-400 border-red-500/20'
    }`}>
      {status}
    </span>
  )
}

const statusColor = (code: number) => {
  if (code >= 200 && code < 300) return 'text-green-400'
  if (code >= 400) return 'text-red-400'
  return 'text-yellow-400'
}

const WebhookTable = ({ deliveries, loading, onRetry, retryingId }: WebhookTableProps) => {
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
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs uppercase tracking-wider">Target URL</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs uppercase tracking-wider">Attempt</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs uppercase tracking-wider">Response</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery) => {
              const isFailed = delivery.status === 'failed'
              return (
                <tr key={delivery.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-text-primary">
                    {new Date(delivery.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs max-w-[300px] truncate">
                    {delivery.targetUrl}
                  </td>
                  <td className="px-4 py-3">{statusBadge(delivery.status)}</td>
                  <td className="px-4 py-3 text-text-primary">{delivery.attemptNumber}</td>
                  <td className={`px-4 py-3 font-mono text-sm font-medium ${statusColor(delivery.httpResponseCode)}`}>
                    {delivery.httpResponseCode}
                  </td>
                  <td className="px-4 py-3">
                    {isFailed && (
                      <button
                        onClick={() => onRetry(delivery.id)}
                        disabled={retryingId === delivery.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
                      >
                        <RotateCw size={12} className={retryingId === delivery.id ? 'animate-spin' : ''} />
                        {retryingId === delivery.id ? 'Retrying...' : 'Retry'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {deliveries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  No webhook deliveries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default WebhookTable
