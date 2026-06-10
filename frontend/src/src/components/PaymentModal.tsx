import { useState } from 'react'
import { X, Loader, CheckCircle, XCircle } from 'lucide-react'
import client from '../api/client'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  amount: number
  currency?: string
  customerEmail?: string
  onSuccess?: (transactionId: string) => void
  onFailure?: (error: string) => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

const PaymentModal = ({ open, onClose, amount, currency = 'INR', customerEmail, onSuccess, onFailure }: PaymentModalProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle')

  if (!open) return null

  const handlePayment = async () => {
    setLoading(true)
    setError('')
    setStatus('processing')

    try {
      const orderRes = await client.post('/payments/order', {
        amount: Math.round(amount * 100),
        currency,
        customerEmail: customerEmail || 'customer@example.com',
      })

      const { orderId, razorpayKey } = orderRes.data

      const options = {
        key: razorpayKey,
        amount: Math.round(amount * 100),
        currency,
        name: 'PayGate',
        description: 'Payment',
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await client.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            setStatus('success')
            onSuccess?.(verifyRes.data.transactionId || response.razorpay_payment_id)
          } catch {
            setStatus('failed')
            setError('Payment verification failed')
            onFailure?.('Payment verification failed')
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
            setStatus('idle')
          },
        },
        prefill: {
          email: customerEmail || '',
        },
        theme: {
          color: '#6366f1',
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', (response: any) => {
        setStatus('failed')
        setError(response.error?.description || 'Payment failed')
        onFailure?.(response.error?.description || 'Payment failed')
      })
      razorpay.open()
    } catch (err: any) {
      setStatus('failed')
      setError(err.response?.data?.error || 'Failed to create payment order')
      onFailure?.(err.response?.data?.error || 'Failed to create payment order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Complete Payment</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-white/5 transition-all">
            <X size={18} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Payment Successful!</h3>
            <p className="text-sm text-text-muted mb-6">Your transaction has been processed.</p>
            <button onClick={onClose}
              className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-all">
              Done
            </button>
          </div>
        ) : status === 'failed' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Payment Failed</h3>
            <p className="text-sm text-red-400 mb-6">{error || 'Something went wrong'}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setStatus('idle'); setError('') }}
                className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-all">
                Try Again
              </button>
              <button onClick={onClose}
                className="px-6 py-2.5 border border-border text-text-secondary rounded-xl text-sm font-medium hover:bg-white/5 transition-all">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-slate-900/50 border border-border/50 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Amount</span>
                <span className="text-2xl font-bold text-text-primary">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount)}
                </span>
              </div>
              {customerEmail && (
                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                  <span className="text-sm text-text-muted">Customer</span>
                  <span className="text-sm text-text-primary">{customerEmail}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>
            )}

            <button onClick={handlePayment} disabled={loading}
              className="w-full px-6 py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2">
              {loading ? <Loader size={16} className="animate-spin" /> : null}
              {loading ? 'Processing...' : `Pay ${new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount)}`}
            </button>

            <p className="text-xs text-text-muted text-center mt-4">
              Secured by Razorpay &middot; Powered by PayGate
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentModal
