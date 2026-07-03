import { useState } from 'react'
import { Key, Plus, Copy, Check, Trash2, AlertTriangle, X, ShieldAlert, Clock } from 'lucide-react'

export interface ApiKey {
  id: string
  name: string
  maskedKey: string
  createdAt: string
  expiresAt: string | null
  isActive: boolean
}

interface ApiKeysPanelProps {
  keys: ApiKey[]
  onCreateKey: (name: string, expiresAt: Date | null) => void
  onDeleteKey: (keyId: string) => void
  isLoading?: boolean
  newlyCreatedKey?: string | null
  onDismissNewKey?: () => void
}

const ApiKeysPanel = ({
  keys,
  onCreateKey,
  onDeleteKey,
  isLoading = false,
  newlyCreatedKey = null,
  onDismissNewKey,
}: ApiKeysPanelProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null)

  return (
    <div className="bg-surface border border-border rounded-[10px] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-display)]">API Keys</h2>
          <p className="text-sm text-text-muted mt-1">Manage keys for authenticating your requests</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          Create Key
        </button>
      </div>

      {newlyCreatedKey && (
        <NewKeyRevealBanner
          fullKey={newlyCreatedKey}
          onDismiss={onDismissNewKey}
        />
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-16 bg-bg-elevated rounded-lg" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <EmptyState onCreateKey={() => setShowCreateModal(true)} />
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <ApiKeyRow
              key={key.id}
              apiKey={key}
              onDelete={() => setDeleteTarget(key)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateKeyModal
          onCreate={(name, expiresAt) => {
            onCreateKey(name, expiresAt)
            setShowCreateModal(false)
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          apiKey={deleteTarget}
          onConfirm={() => {
            onDeleteKey(deleteTarget.id)
            setDeleteTarget(null)
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

const ApiKeyRow = ({
  apiKey,
  onDelete,
}: {
  apiKey: ApiKey
  onDelete: () => void
}) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()
  const status = !apiKey.isActive
    ? 'revoked'
    : isExpired
      ? 'expired'
      : 'active'

  const statusStyles = {
    active: 'bg-success-soft text-success border-success/20',
    expired: 'bg-warning-soft text-warning border-warning/20',
    revoked: 'bg-danger-soft text-danger border-danger/20',
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-bg-primary border border-border rounded-lg group hover:border-border-accent transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        <div className="p-2 bg-surface border border-border rounded-lg">
          <Key size={14} className="text-accent" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">{apiKey.name}</span>
            <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${statusStyles[status]}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <code className="text-xs font-mono text-text-muted">{apiKey.maskedKey}</code>
            <span className="text-xs text-text-muted">Created {formatDate(apiKey.createdAt)}</span>
            {apiKey.expiresAt && (
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Clock size={10} /> Expires {formatDate(apiKey.expiresAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => copyToClipboard(apiKey.maskedKey)}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-black/[0.03] rounded-lg transition-colors"
          title="Copy key"
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-text-muted hover:text-danger hover:bg-danger-soft rounded-lg transition-colors"
          title="Delete key"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

const CreateKeyModal = ({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string, expiresAt: Date | null) => void
  onCancel: () => void
}) => {
  const [name, setName] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState('')

  const handleSubmit =async  () => {
    if (!name.trim()) {
      setError('Key name is required')
      return
    }
    onCreate(
      name.trim(),
      expiresAt ? new Date(expiresAt) : null,
    )
// const result =  await 



  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-[10px] max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-display)]">Create API Key</h3>
          <button onClick={onCancel} className="p-1 text-text-muted hover:text-text-primary rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Key Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="e.g. Chatbot Key"
              className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
              autoFocus
            />
            {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1.5">Expiration <span className="text-text-muted">(optional)</span></label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
            />
            <p className="text-xs text-text-muted mt-1.5">Leave blank for no expiration</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-black/[0.03] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors"
          >
            Create Key
          </button>
        </div>
      </div>
    </div>
  )
}

const DeleteConfirmModal = ({
  apiKey,
  onConfirm,
  onCancel,
}: {
  apiKey: ApiKey
  onConfirm: () => void
  onCancel: () => void
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-[10px] max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-danger-soft rounded-full">
            <AlertTriangle size={20} className="text-danger" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Delete API Key?</h3>
            <p className="text-sm text-text-muted mt-1">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary mb-2 leading-relaxed">
          The key <span className="font-medium text-text-primary">"{apiKey.name}"</span> will be permanently deleted.
        </p>
        <p className="text-sm text-danger mb-6 leading-relaxed">
          Any integrations using this key will <span className="font-medium">stop working immediately</span>.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-black/[0.03] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 text-sm font-medium text-white bg-danger hover:bg-red-600 rounded-lg transition-colors"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  )
}

const NewKeyRevealBanner = ({
  fullKey,
  onDismiss,
}: {
  fullKey: string
  onDismiss?: () => void
}) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-4 p-4 bg-warning-soft border border-warning/20 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-warning/10 rounded-lg shrink-0 mt-0.5">
          <ShieldAlert size={16} className="text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-warning mb-1">Save your key now</p>
          <p className="text-xs text-text-muted mb-3">
            This is the only time you'll see the full key. Copy it before dismissing.
          </p>
          <div className="flex items-center bg-bg-primary border border-border rounded-lg overflow-hidden">
            <code className="flex-1 px-4 py-2.5 text-sm font-mono text-text-primary truncate">{fullKey}</code>
            <button
              onClick={() => copyToClipboard(fullKey)}
              className="px-4 py-2.5 border-l border-border hover:bg-black/[0.03] transition-colors"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-text-muted" />}
            </button>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-text-muted hover:text-text-primary rounded-lg transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

const EmptyState = ({ onCreateKey }: { onCreateKey: () => void }) => (
  <div className="text-center py-12">
    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
      <Key size={20} className="text-accent" />
    </div>
    <h3 className="text-sm font-medium text-text-primary mb-1">No API keys yet</h3>
    <p className="text-xs text-text-muted mb-4 max-w-xs mx-auto">
      Create your first API key to start accepting payments.
    </p>
    <button
      onClick={onCreateKey}
      className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
    >
      <Plus size={14} />
      Create Key
    </button>
  </div>
)

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default ApiKeysPanel
