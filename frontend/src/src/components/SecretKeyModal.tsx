import { useState } from 'react'
import { Copy, Check, ShieldAlert } from 'lucide-react'

interface SecretKeyModalProps {
  publicKey: string
  secretKey: string
  onSaved: () => void
}

const SecretKeyModal = ({ publicKey, secretKey, onSaved }: SecretKeyModalProps) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(text)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-[10px] max-w-lg w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-warning-soft text-warning">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary font-[family-name:var(--font-display)]">Your API Keys</h2>
            <p className="text-sm text-danger font-medium mt-1">
              Save your secret key now — it will never be shown again
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">Public Key</label>
            <div className="flex items-center bg-bg-primary border border-border rounded-lg overflow-hidden">
              <code className="flex-1 px-4 py-3 text-sm font-mono text-text-primary">{publicKey}</code>
              <button
                onClick={() => copyToClipboard(publicKey)}
                className="px-4 py-3 border-l border-border hover:bg-black/[0.03] transition-colors"
              >
                {copiedKey === publicKey ? <Check size={16} className="text-success" /> : <Copy size={16} className="text-text-muted" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">Secret Key</label>
            <div className="flex items-center bg-bg-primary border border-border rounded-lg overflow-hidden">
              <code className="flex-1 px-4 py-3 text-sm font-mono text-text-primary">{secretKey}</code>
              <button
                onClick={() => copyToClipboard(secretKey)}
                className="px-4 py-3 border-l border-border hover:bg-black/[0.03] transition-colors"
              >
                {copiedKey === secretKey ? <Check size={16} className="text-success" /> : <Copy size={16} className="text-text-muted" />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onSaved}
          className="w-full mt-8 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
        >
          I have saved my keys → Go to Dashboard
        </button>
      </div>
    </div>
  )
}

export default SecretKeyModal
