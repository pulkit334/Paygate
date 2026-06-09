import { Link } from 'react-router-dom'
import { ArrowRight, Check, Shield, BookCopy, Webhook, Workflow, BarChart3, Code, Key, Search, Database, Globe, ArrowLeft } from 'lucide-react'

const featureGroups = [
  {
    title: 'Core Platform',
    subtitle: 'The foundational building blocks of your payment infrastructure.',
    features: [
      {
        icon: Key, title: 'API Key Authentication',
        desc: 'Every app gets unique public/secret key pairs. Public keys identify the app, secret keys authorize payments. Rotate keys anytime from the dashboard.',
        highlights: ['Public key (pk_live_) for client-side', 'Secret key (sk_live_) for server-side', 'Instant key rotation with confirmation', 'Granular key permissions per app'],
      },
      {
        icon: BookCopy, title: 'Double-Entry Ledger',
        desc: 'Every financial transaction is recorded as two matched entries — a debit and a credit. Full audit trail with balance verification for compliance.',
        highlights: ['Immutable transaction records', 'Real-time balance tracking', 'Audit-ready export', 'Reconciliation reports'],
      },
      {
        icon: Webhook, title: 'Webhook Engine',
        desc: 'Receive real-time notifications for payment events. Automatic retry with exponential backoff, delivery logging, and signature verification.',
        highlights: ['3 retry attempts with backoff', 'HMAC-SHA256 signature', 'Delivery logs & history', 'Manual retry from dashboard'],
      },
      {
        icon: Workflow, title: 'Multi-App Isolation',
        desc: 'Each app operates in its own isolated environment. Separate API keys, independent analytics, segregated webhook configs, and individual settings.',
        highlights: ['Per-app API credentials', 'Independent analytics', 'Isolated webhook configs', 'App-level rate limits'],
      },
      {
        icon: BarChart3, title: 'Analytics & Reporting',
        desc: 'Real-time metrics on payment volume, transaction counts, success rates, and daily trends. Export reports for finance and accounting teams.',
        highlights: ['Live dashboard metrics', '7-day volume trends', 'Success rate tracking', 'CSV report export'],
      },
      {
        icon: Shield, title: 'Enterprise Security',
        desc: 'JWT-based authentication, rate limiting, idempotency keys, Razorpay signature verification, and comprehensive audit logging across all services.',
        highlights: ['JWT token authentication', 'Rate limiting per endpoint', 'Idempotency key support', 'Full audit trail logs'],
      },
    ],
  },
  {
    title: 'Developer Experience',
    subtitle: 'Tools and APIs designed for engineering teams building at scale.',
    features: [
      {
        icon: Code, title: 'RESTful API',
        desc: 'Clean, predictable REST APIs with consistent response formats. Every endpoint supports idempotency for safe retries.',
        highlights: ['JSON request/response', 'Idempotency key support', 'Consistent error format', 'P99 < 200ms latency'],
      },
      {
        icon: Database, title: 'Local Development SDK',
        desc: 'Drop-in SDK for React apps. The PaymentModal component handles the entire checkout flow with zero configuration.',
        highlights: ['React component SDK', 'TypeScript support', 'Customizable UI', 'Webhook test mode'],
      },
      {
        icon: Search, title: 'Transaction Search',
        desc: 'Full-text search across all transactions with filters by status, date range, amount, and customer email. Expandable details for every payment.',
        highlights: ['Full-text search', 'Multi-filter system', 'Expandable transaction details', 'Bulk export capability'],
      },
      {
        icon: Globe, title: 'Multi-Currency Support',
        desc: 'Accept payments in INR, USD, and more. Automatic currency conversion with real-time rates from Razorpay.',
        highlights: ['INR & USD support', 'Real-time currency conversion', 'Per-app currency config', 'Settlement in base currency'],
      },
    ],
  },
]

const comparisonRows = [
  { feature: 'Integration Time', paygate: '2 days', direct: '3-4 weeks' },
  { feature: 'Apps Supported', paygate: 'Unlimited', direct: 'Per-app integration' },
  { feature: 'API Key Management', paygate: 'Centralized dashboard', direct: 'Per-app manual setup' },
  { feature: 'Webhook Handling', paygate: 'Auto-retry + logs', direct: 'Custom implementation' },
  { feature: 'Analytics', paygate: 'Cross-app dashboard', direct: 'Per-app manual tracking' },
  { feature: 'Double-Entry Ledger', paygate: 'Built-in', direct: 'Custom build required' },
  { feature: 'Idempotency', paygate: 'Built into every endpoint', direct: 'Custom implementation' },
  { feature: 'Rate Limiting', paygate: 'Configurable per app', direct: 'Manual configuration' },
]

const FeatureCard = ({ feature, index }: { feature: typeof featureGroups[0]['features'][0], index: number }) => (
  <div className="glass-light rounded-2xl p-7 card-hover" style={{ animationDelay: `${index * 0.05}s` }}>
    <div className="flex items-start gap-5">
      <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
        <feature.icon size={22} className="text-accent" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">{feature.desc}</p>
        <div className="grid grid-cols-2 gap-2">
          {feature.highlights.map((h) => (
            <div key={h} className="flex items-center gap-2 text-xs text-text-muted">
              <Check size={10} className="text-success shrink-0" />
              {h}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

const Features = () => {
  return (
    <div className="min-h-screen bg-bg-primary">
      <nav className="glass border-b border-border/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-xl font-bold text-text-primary tracking-tight">PayGate</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Sign in</Link>
            <Link to="/register" className="px-5 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-accent/20 inline-flex items-center gap-2">
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      <section className="py-20 md:py-28 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary mb-8 transition-colors">
            <ArrowLeft size={14} /> Back to home
          </Link>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary tracking-tight">
            Everything you need to{' '}
            <span className="gradient-text">scale payments</span>
          </h1>
          <p className="mt-5 text-lg text-text-secondary max-w-2xl mx-auto">
            Purpose-built for engineering teams managing payment infrastructure across multiple apps and services.
            No more building the same integration ten times.
          </p>
        </div>
      </section>

      {featureGroups.map((group) => (
        <section key={group.title} className="py-16 md:py-24 border-t border-border/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">{group.title}</h2>
              <p className="text-text-secondary mt-3">{group.subtitle}</p>
            </div>
            <div className="space-y-5">
              {group.features.map((feature, i) => (
                <FeatureCard key={feature.title} feature={feature} index={i} />
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="py-20 md:py-24 border-t border-border/20 bg-gradient-to-b from-transparent via-accent/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
              PayGate vs. Direct Integration
            </h2>
            <p className="mt-4 text-text-secondary text-lg">
              Stop building the same payment integration in every app. One platform, one integration, every product.
            </p>
          </div>

          <div className="max-w-4xl mx-auto overflow-hidden rounded-2xl border border-border/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-border/50">
                  <th className="text-left px-6 py-4 text-text-muted font-medium">Feature</th>
                  <th className="text-left px-6 py-4 text-accent font-semibold">PayGate</th>
                  <th className="text-left px-6 py-4 text-text-muted font-medium">Direct Razorpay</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-border/30 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                    <td className="px-6 py-4 text-text-primary font-medium">{row.feature}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-success shrink-0" />
                        <span className="text-green-400">{row.paygate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted">{row.direct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 relative overflow-hidden border-t border-border/20">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-purple-500/10 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-6">
            Ready to simplify your{' '}
            <span className="gradient-text">payment stack</span>?
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            Stop maintaining N payment integrations. Start with one.
          </p>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold transition-all shadow-xl shadow-accent/25 hover:shadow-accent/40 text-lg group">
            Get Started Free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="text-sm text-text-muted">&copy; {new Date().getFullYear()} PayGate.</span>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-text-muted hover:text-text-secondary transition-colors">Home</Link>
            <Link to="/pricing" className="text-sm text-text-muted hover:text-text-secondary transition-colors">Pricing</Link>
            <Link to="/docs" className="text-sm text-text-muted hover:text-text-secondary transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Features
