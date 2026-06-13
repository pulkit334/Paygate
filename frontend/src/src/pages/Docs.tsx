import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Code, BookOpen, Terminal, Package,
  Settings as SettingsIcon, Shield, ChevronRight, Copy, Check, Menu, X,
} from 'lucide-react'

const sections = [
  { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
  { id: 'authentication', label: 'Authentication', icon: Shield },
  { id: 'payments', label: 'Payments API', icon: Terminal },
  { id: 'sdk', label: 'React SDK', icon: Package },
  { id: 'webhooks', label: 'Webhooks', icon: Code },
  { id: 'errors', label: 'Error Codes', icon: SettingsIcon },
]

interface CodeBlockProps {
  code: string
}

const CodeBlock = ({ code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block my-4">
      <div className="header">
        <div className="dots"><div className="dot" /><div className="dot" /><div className="dot" /></div>
        <span className="text-xs text-text-muted font-mono">bash</span>
        <button onClick={handleCopy} className="ml-auto text-text-muted hover:text-text-primary transition-colors">
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="p-5 text-sm font-mono text-text-secondary overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

const content = {
  'getting-started': {
    title: 'Getting Started',
    body: (
      <div className="space-y-6">
        <p className="text-text-secondary leading-relaxed">
          PayGate provides a unified payment API for all your apps. This guide will help you
          set up your first integration in under 5 minutes.
        </p>

        <h3 className="text-lg font-semibold text-text-primary mt-8">1. Create an Account</h3>
        <p className="text-text-secondary">Register your app at the PayGate dashboard. You'll need your company name, email, and password.</p>
        <CodeBlock code={`curl -X POST https://api.paygate.io/v1/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "MyApp",
    "email": "dev@myapp.com",
    "password": "your-secure-password"
  }'`} />

        <h3 className="text-lg font-semibold text-text-primary">2. Get Your API Keys</h3>
        <p className="text-text-secondary">After registration, you'll receive:</p>
        <div className="bg-surface border border-border rounded-[10px] p-5 space-y-4">
          <div>
            <p className="text-xs text-text-muted mb-1">Public Key (client-side)</p>
            <code className="block bg-bg-primary border border-border rounded-lg px-4 py-3 text-sm font-mono text-text-primary">pk_live_2x7m9k4q3w8e1r5t6y0u</code>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Secret Key (server-side — shown only once!)</p>
            <code className="block bg-bg-primary border border-border rounded-lg px-4 py-3 text-sm font-mono text-warning">sk_live_9a1b2c3d4e5f6g7h8i9j</code>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-text-primary">3. Authenticate</h3>
        <p className="text-text-secondary">Use your JWT token from login for authenticated requests. Send it as a Bearer token.</p>
        <CodeBlock code={`curl https://api.paygate.io/v1/payments \\
  -H "Authorization: Bearer <your-jwt-token>" \\
  -H "Content-Type: application/json"`} />
      </div>
    ),
  },
  'authentication': {
    title: 'Authentication',
    body: (
      <div className="space-y-6">
        <p className="text-text-secondary leading-relaxed">
          PayGate uses two authentication mechanisms: JWT tokens for API access and API keys for payment operations.
        </p>

        <h3 className="text-lg font-semibold text-text-primary">JWT Authentication</h3>
        <p className="text-text-secondary">All API requests (except register and login) require a JWT token in the Authorization header.</p>
        <CodeBlock code={`// Login to get your JWT token
POST /v1/login
{
  "email": "dev@myapp.com",
  "password": "your-secure-password"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}`} />

        <h3 className="text-lg font-semibold text-text-primary">API Key Authentication</h3>
        <p className="text-text-secondary">Payment creation requires an additional API key sent via the x-api-key header.</p>
        <CodeBlock code={`// Creating a payment order
curl -X POST https://api.paygate.io/v2/create \\
  -H "Authorization: Bearer <jwt-token>" \\
  -H "x-api-key: sk_live_9a1b2c3d4e5f6g7h8i9j" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 249900,
    "currency": "INR",
    "idempotencyKey": "unique-txn-id-123"
  }'`} />
      </div>
    ),
  },
  'payments': {
    title: 'Payments API',
    body: (
      <div className="space-y-6">
        <p className="text-text-secondary leading-relaxed">
          Create, verify, and manage payments through our RESTful API. Every endpoint supports
          idempotency keys for safe retries.
        </p>

        <h3 className="text-lg font-semibold text-text-primary">Create Payment Order</h3>
        <CodeBlock code={`POST /v2/create

{
  "amount": 249900,          // Amount in paise (₹2499.00)
  "currency": "INR",          // INR or USD
  "idempotencyKey": "txn_...", // Unique, prevents duplicates
  "customerEmail": "user@example.com",
  "metadata": {
    "orderId": "ORD-12345",
    "product": "Premium Plan"
  }
}`} />
        <CodeBlock code={`// Response
{
  "success": true,
  "orderId": "order_9x7m4k3q",
  "amount": 249900,
  "currency": "INR",
  "status": "created",
  "createdAt": "2024-01-15T10:30:00Z"
}`} />

        <h3 className="text-lg font-semibold text-text-primary mt-8">Verify Payment</h3>
        <p className="text-text-secondary">After Razorpay checkout completes, verify the payment signature server-side.</p>
        <CodeBlock code={`POST /v2/verify

{
  "razorpay_order_id": "order_9x7m4k3q",
  "razorpay_payment_id": "pay_3k8w1e5r",
  "razorpay_signature": "signature_..."
}`} />
      </div>
    ),
  },
  'sdk': {
    title: 'React SDK',
    body: (
      <div className="space-y-6">
        <p className="text-text-secondary leading-relaxed">
          Our React SDK provides a drop-in PaymentModal component. Import it into any app and start collecting payments immediately.
        </p>

        <h3 className="text-lg font-semibold text-text-primary">Installation</h3>
        <CodeBlock code={`npm install @paygate/widget`} />

        <h3 className="text-lg font-semibold text-text-primary">Usage</h3>
        <CodeBlock code={`import { PaymentModal } from '@paygate/widget';

function CheckoutPage() {
  return (
    <PaymentModal
      amount={2499}
      currency="INR"
      merchantPublicKey="pk_live_..."
      onSuccess={(transactionId) => {
        console.log('Payment succeeded:', transactionId);
      }}
      onFailure={(error) => {
        console.error('Payment failed:', error);
      }}
    />
  );
}`} />

        <div className="bg-warning/10 border border-warning/20 rounded-[10px] p-5 mt-6">
          <p className="text-sm text-warning font-medium">Important</p>
          <p className="text-sm text-text-secondary mt-1">
            Never expose your secret key in client-side code. The PaymentModal only needs your
            public key. All secret key operations happen server-side.
          </p>
        </div>
      </div>
    ),
  },
  'webhooks': {
    title: 'Webhooks',
    body: (
      <div className="space-y-6">
        <p className="text-text-secondary leading-relaxed">
          PayGate sends webhook events to your registered callback URL for payment status changes.
          Each webhook is signed for verification.
        </p>

        <h3 className="text-lg font-semibold text-text-primary">Registering a Webhook URL</h3>
        <p className="text-text-secondary">Set your callback URL in the Settings page of your dashboard, or via the API.</p>
        <CodeBlock code={`PUT /v1/apps/callback-url
{
  "callbackUrl": "https://api.myapp.com/webhooks/paygate"
}`} />

        <h3 className="text-lg font-semibold text-text-primary">Webhook Payload</h3>
        <CodeBlock code={`// POST to your callback URL
{
  "event": "payment.paid",
  "transactionId": "txn_9x7m4k3q",
  "orderId": "order_9x7m4k3q",
  "amount": 249900,
  "currency": "INR",
  "status": "paid",
  "paidAt": "2024-01-15T10:30:00Z",
  "signature": "hmac-sha256-signature"
}`} />

        <h3 className="text-lg font-semibold text-text-primary">Signature Verification</h3>
        <CodeBlock code={`const crypto = require('crypto');

function verifyWebhook(payload, signature, secretKey) {
  const expected = crypto
    .createHmac('sha256', secretKey)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`} />

        <h3 className="text-lg font-semibold text-text-primary">Retry Policy</h3>
        <p className="text-text-secondary">
          Failed webhooks are retried up to 3 times with exponential backoff (10s, 30s, 90s).
          You can manually retry from the Webhooks page in the dashboard.
        </p>
      </div>
    ),
  },
  'errors': {
    title: 'Error Codes',
    body: (
      <div className="space-y-6">
        <p className="text-text-secondary leading-relaxed">
          All API errors return a consistent JSON response with an error message and type.
        </p>

        <CodeBlock code={`// Standard error response
{
  "error": "Description of what went wrong",
  "type": "ErrorCategory"
}`} />

        <h3 className="text-lg font-semibold text-text-primary">Error Categories</h3>
        <div className="overflow-hidden rounded-[10px] border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border/50">
                <th className="text-left px-5 py-3 text-text-muted font-medium">Type</th>
                <th className="text-left px-5 py-3 text-text-muted font-medium">HTTP Code</th>
                <th className="text-left px-5 py-3 text-text-muted font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['ValidationError', '400', 'Invalid request body or parameters'],
                ['AuthError', '401', 'Missing or invalid authentication'],
                ['NotFoundError', '404', 'Resource not found'],
                ['UniqueConstraintError', '409', 'Duplicate idempotency key or email'],
                ['RateLimitError', '429', 'Too many requests — slow down'],
                ['PaymentError', '400', 'Payment processing failed'],
                ['ServiceError', '500', 'Internal server error'],
              ].map(([type, code, desc], i) => (
                <tr key={type} className={`border-b border-border/30 ${i % 2 === 0 ? 'bg-black/[0.02]' : ''}`}>
                  <td className="px-5 py-3">
                    <code className="text-xs text-danger font-mono">{type}</code>
                  </td>
                  <td className="px-5 py-3 text-text-primary font-mono">{code}</td>
                  <td className="px-5 py-3 text-text-muted">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
}

const Docs = () => {
  const [activeSection, setActiveSection] = useState('getting-started')
  const [mobileNav, setMobileNav] = useState(false)
  const hasToken = document.cookie.split('; ').some(c => c.startsWith('token='))

  const activeContent = content[activeSection as keyof typeof content]

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 border-b border-border/50 bg-bg-primary/85 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 bg-text-primary rotate-45 rounded-sm" />
                <span className="relative text-white font-bold text-sm font-[family-name:var(--font-display)]">P</span>
              </div>
              <span className="text-lg font-bold text-text-primary tracking-tight font-[family-name:var(--font-display)]">PayGate</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link to="/docs" className="px-4 py-2 text-sm font-medium text-accent bg-accent/5 rounded-lg">API Docs</Link>
              <Link to="/features" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-black/[0.03]">Integrations</Link>
              <span className="px-4 py-2 text-sm font-medium text-text-muted/50 cursor-default">Pricing</span>
              <span className="px-4 py-2 text-sm font-medium text-text-muted/50 cursor-default">Changelog</span>
              <span className="px-4 py-2 text-sm font-medium text-text-muted/50 cursor-default">Status</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/" className="hidden sm:inline-flex px-4 py-2 border border-border rounded-md text-sm font-medium text-text-secondary hover:border-border-accent hover:text-text-primary transition-all">Contact Sales</Link>
              <Link to="/dashboard" className="px-5 py-2 bg-accent hover:bg-accent-hover rounded-md text-sm font-semibold text-white transition-all active:scale-[0.97]">Get API Access</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border min-h-screen">
          <div className="p-5 border-b border-border">
            <Link to={hasToken ? '/dashboard' : '/'} className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 bg-text-primary rotate-45 rounded-sm" />
                <span className="relative text-white font-bold text-sm font-[family-name:var(--font-display)]">P</span>
              </div>
              <span className="text-lg font-bold text-text-primary tracking-tight font-[family-name:var(--font-display)]">PayGate</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 mb-3">API Reference</p>
            {sections.map((section) => (
              <button key={section.id} onClick={() => setActiveSection(section.id)}
                className={`w-full px-3 py-2.5 rounded-md text-left text-sm flex items-center gap-3 transition-colors ${
                  activeSection === section.id
                    ? 'text-accent bg-accent/10 font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-black/[0.03]'
                }`}>
                <section.icon size={16} />
                {section.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <Link to={hasToken ? '/dashboard' : '/'}
              className="flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors">
              <ArrowLeft size={14} /> Back to {hasToken ? 'Dashboard' : 'Home'}
            </Link>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="lg:hidden border-b border-border px-4 py-3 flex items-center justify-between bg-bg-primary/85 backdrop-blur-xl">
            <Link to={hasToken ? '/dashboard' : '/'} className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 flex items-center justify-center">
                <div className="absolute inset-0 bg-text-primary rotate-45 rounded-sm" />
                <span className="relative text-white font-bold text-xs font-[family-name:var(--font-display)]">P</span>
              </div>
              <span className="text-base font-bold text-text-primary tracking-tight font-[family-name:var(--font-display)]">PayGate</span>
            </Link>
            <button onClick={() => setMobileNav(!mobileNav)} className="p-1.5 text-text-secondary hover:text-text-primary">
              {mobileNav ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {mobileNav && (
            <div className="lg:hidden bg-surface border-b border-border px-4 py-3 space-y-1">
              {sections.map((section) => (
                <button key={section.id} onClick={() => { setActiveSection(section.id); setMobileNav(false) }}
                  className={`w-full px-3 py-2.5 rounded-md text-left text-sm flex items-center gap-3 transition-colors ${
                    activeSection === section.id
                      ? 'text-accent bg-accent/10 font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-black/[0.03]'
                  }`}>
                  <section.icon size={16} />
                  {section.label}
                </button>
              ))}
            </div>
          )}

          <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-text-primary mb-6 font-[family-name:var(--font-display)]">{activeContent.title}</h2>
              {activeContent.body}
            </div>

            <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
              <button onClick={() => {
                const idx = sections.findIndex(s => s.id === activeSection)
                if (idx > 0) setActiveSection(sections[idx - 1].id)
              }}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  sections.findIndex(s => s.id === activeSection) > 0
                    ? 'text-text-secondary hover:text-text-primary'
                    : 'text-text-muted cursor-not-allowed'
                }`}>
                <ArrowLeft size={14} /> Previous
              </button>
              <button onClick={() => {
                const idx = sections.findIndex(s => s.id === activeSection)
                if (idx < sections.length - 1) setActiveSection(sections[idx + 1].id)
              }}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  sections.findIndex(s => s.id === activeSection) < sections.length - 1
                    ? 'text-text-secondary hover:text-text-primary'
                    : 'text-text-muted cursor-not-allowed'
                }`}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </main>

          <footer className="border-t border-border py-6 mt-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between">
              <span className="text-sm text-text-muted">&copy; {new Date().getFullYear()} PayGate</span>
              <div className="flex items-center gap-4">
                <Link to="/features" className="text-sm text-text-muted hover:text-text-secondary transition-colors">Features</Link>
                <Link to="/docs" className="text-sm text-text-muted hover:text-text-secondary transition-colors">API Reference</Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default Docs
