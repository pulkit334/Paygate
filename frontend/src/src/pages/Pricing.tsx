import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ArrowLeft, HelpCircle, Mail } from 'lucide-react'

const tiers = [
  {
    name: 'Starter',
    price: { monthly: 0, yearly: 0 },
    desc: 'For side projects and small apps testing the waters.',
    features: [
      'Up to 3 apps',
      '1,000 transactions/mo',
      'Basic analytics dashboard',
      'Webhook support',
      'Community support',
      'API key authentication',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Business',
    price: { monthly: 299, yearly: 2990 },
    desc: 'For growing teams that need reliable payment infrastructure.',
    features: [
      'Up to 15 apps',
      '50,000 transactions/mo',
      'Advanced analytics & reports',
      'Webhook retry + delivery logs',
      'Priority email support',
      'API key rotation',
      'Custom callback URLs',
      'Multi-app isolation',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: { monthly: 999, yearly: 9990 },
    desc: 'For large organizations with complex payment workflows.',
    features: [
      'Unlimited apps',
      'Unlimited transactions',
      'Real-time analytics & alerts',
      'Custom webhook rules engine',
      'Dedicated support engineer',
      'SSO + RBAC',
      '99.99% SLA guarantee',
      'On-premise deployment option',
      'Custom integration support',
      'Early access to new features',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

const faqs = [
  {
    q: 'What happens when I exceed my transaction limit?',
    a: 'We\'ll notify you at 80% and 100% usage. You can upgrade your plan at any time — no service interruption.',
  },
  {
    q: 'Can I add more apps beyond my plan limit?',
    a: 'Yes. You can upgrade your plan to add more apps or contact us for a custom enterprise plan.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are SOC 2 compliant and ISO 27001 certified.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No contracts, no lock-in. You keep access until the end of your billing period.',
  },
  {
    q: 'Do you offer on-premise deployment?',
    a: 'Yes. Our Enterprise plan includes on-premise deployment options for organizations with specific data residency requirements.',
  },
  {
    q: 'What payment methods do you support?',
    a: 'Through our Razorpay integration, we support credit/debit cards, UPI, net banking, wallets, and EMI options.',
  },
]

const Pricing = () => {
  const [yearly, setYearly] = useState(false)

  return (
    <div className="min-h-screen bg-bg-primary">
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
              <Link to="/docs" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-black/[0.03]">API Docs</Link>
              <Link to="/features" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-black/[0.03]">Integrations</Link>
              <Link to="/pricing" className="px-4 py-2 text-sm font-medium text-accent bg-accent/5 rounded-lg">Pricing</Link>
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

      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary mb-8 transition-colors">
            <ArrowLeft size={14} /> Back to home
          </Link>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary tracking-tight font-[family-name:var(--font-display)]">
            Simple, transparent{' '}
            <span className="text-accent">pricing</span>
          </h1>
          <p className="mt-5 text-lg text-text-secondary max-w-2xl mx-auto">
            Start for free. Scale as you grow. No hidden fees, no surprises — just one platform
            for every app in your ecosystem.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-3 bg-surface rounded-md p-1.5 border border-border/50">
              <button onClick={() => setYearly(false)}
                className={`px-5 py-2 rounded text-sm font-medium transition-all ${
                  !yearly ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                }`}>
                Monthly
              </button>
              <button onClick={() => setYearly(true)}
                className={`px-5 py-2 rounded text-sm font-medium transition-all ${
                  yearly ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                }`}>
                Yearly
                <span className="ml-2 text-xs text-success font-semibold">Save ~17%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <div key={tier.name} className={`relative rounded-[10px] p-8 card-hover ${
                tier.highlighted
                  ? 'bg-accent-soft border-2 border-accent/40'
                  : 'bg-surface border border-border'
              }`}>
                {tier.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-xs font-semibold rounded">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-text-primary mb-2 font-[family-name:var(--font-display)]">{tier.name}</h3>
                <p className="text-sm text-text-muted mb-6">{tier.desc}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-text-primary font-[family-name:var(--font-display)]">
                    {tier.price.monthly === 0 ? 'Free' : `₹${(yearly ? tier.price.yearly : tier.price.monthly).toLocaleString('en-IN')}`}
                  </span>
                  {tier.price.monthly > 0 && (
                    <span className="text-text-muted ml-1.5 text-sm">{yearly ? '/yr' : '/mo'}</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8 min-h-[280px]">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-text-secondary">
                      <Check size={16} className="text-accent shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link to="/"
                  className={`block w-full text-center py-3.5 rounded-md font-medium transition-all ${
                    tier.highlighted
                      ? 'bg-accent hover:bg-accent-hover text-white'
                      : 'border border-border hover:border-accent/50 text-text-primary hover:bg-black/[0.03]'
                  }`}>
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t border-border/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight font-[family-name:var(--font-display)]">
              Frequently asked{' '}
              <span className="text-accent">questions</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-surface border border-border rounded-[10px] p-6">
                <div className="flex items-start gap-3">
                  <HelpCircle size={16} className="text-accent shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-2">{faq.q}</h3>
                    <p className="text-sm text-text-muted leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 relative overflow-hidden border-t border-border/30">

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-6 font-[family-name:var(--font-display)]">
            Still have questions?{' '}
            <span className="text-accent">We're here.</span>
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            Not sure which plan fits your team? Our engineering team will help you figure it out.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="mailto:sales@paygate.io"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-hover text-white rounded-md font-semibold transition-all text-lg">
              <Mail size={18} /> Contact Sales
            </a>
            <Link to="/"
              className="inline-flex items-center gap-2 px-8 py-4 border border-border hover:border-accent/50 text-text-primary rounded-md font-medium transition-all text-lg">
              Get Started <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="text-sm text-text-muted">&copy; {new Date().getFullYear()} PayGate.</span>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-text-muted hover:text-text-secondary transition-colors">Home</Link>
            <Link to="/features" className="text-sm text-text-muted hover:text-text-secondary transition-colors">Features</Link>
            <Link to="/docs" className="text-sm text-text-muted hover:text-text-secondary transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Pricing
