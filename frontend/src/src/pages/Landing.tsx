import { Link } from 'react-router-dom'
import {
  ArrowRight, Code, Shield, ArrowUpRight,
  Zap, RefreshCw, BarChart3, Webhook, Key, Database,
  CheckCircle, Globe,
} from 'lucide-react'
import { FadeIn } from '../hooks/useInView'

const providers = ['Stripe', 'Razorpay', 'PayU', 'Braintree', 'PayPal', 'Square', 'Adyen', 'Cashfree']

const Landing = () => {

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ── NAVBAR ── */}
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
              <Link to="/docs" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-black/[0.03]">
                API Docs
              </Link>
              <Link to="/features" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-black/[0.03]">
                Integrations
              </Link>
              <Link to="/pricing" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-black/[0.03]">
                Pricing
              </Link>
              <span className="px-4 py-2 text-sm font-medium text-text-muted/50 cursor-default">Changelog</span>
              <span className="px-4 py-2 text-sm font-medium text-text-muted/50 cursor-default">Status</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/contact"
                className="hidden sm:inline-flex px-4 py-2 border border-accent/40 bg-accent/5 rounded-md text-sm font-medium text-accent transition-all hover:bg-accent/10">
                Contact Sales
              </Link>
              <Link to="/register"
                className="px-5 py-2 bg-accent hover:bg-accent-hover rounded-md text-sm font-semibold text-white transition-all active:scale-[0.97]">
                Get API Access
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="min-h-[calc(100vh-64px)] flex items-center py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-soft border border-accent/20 rounded-full text-xs font-semibold tracking-wider text-accent uppercase mb-7">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Payment Orchestration · Now in GA
                </div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="text-4xl sm:text-5xl lg:text-[68px] font-bold text-text-primary tracking-[-0.04em] leading-[1.05] mb-6 font-[family-name:var(--font-display)]">
                  Route. Retry.<br />
                  <span className="text-accent">Reconcile.</span><br />
                  One API for every payment provider.
                </h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                <p className="text-lg text-text-secondary max-w-lg mb-10 leading-relaxed">
                  PayGate sits between your app and your payment providers. Intelligent routing, automatic failover, and a unified dashboard — without rebuilding your stack.
                </p>
              </FadeIn>
              <FadeIn delay={0.3}>
                <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
                  <Link to="/register"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-hover text-white rounded-md font-semibold transition-all active:scale-[0.97] shadow-lg shadow-accent/20">
                    Get API Access
                  </Link>
                  <Link to="/docs"
                    className="inline-flex items-center gap-2 px-8 py-4 text-text-muted hover:text-text-secondary font-medium transition-colors">
                    Read the Docs <ArrowRight size={16} />
                  </Link>
                </div>
              </FadeIn>
              <FadeIn delay={0.4}>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  {[
                    { icon: Shield, label: 'SOC 2 Certified' },
                    { icon: CheckCircle, label: '99.99% Uptime' },
                    { icon: Zap, label: 'Sub-200ms Routing' },
                    { icon: Globe, label: 'GDPR Ready' },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted">
                      <Icon size={14} className="text-accent" />
                      {label}
                    </span>
                  ))}
                </div>
              </FadeIn>
            </div>

            {/* Hero Diagram */}
            <FadeIn delay={0.3} className="hidden lg:flex justify-center">
              <div className="w-full max-w-md bg-surface border border-border rounded-[10px] p-8 relative shadow-xl shadow-black/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-bg-elevated border border-border rounded-lg p-4 text-center">
                    <div className="text-sm font-semibold text-text-primary">Your App</div>
                    <div className="text-[10px] text-text-muted mt-0.5">REST / SDK</div>
                  </div>
                  <div className="w-16 h-0.5 bg-border relative">
                    <div className="absolute w-2 h-2 rounded-full bg-accent top-[-3px] animate-pulse-dot" />
                    <div className="absolute w-2 h-2 rounded-full bg-accent top-[-3px] animate-pulse-dot-delay" />
                  </div>
                  <div className="flex-1 bg-accent-soft border border-accent/30 rounded-lg p-4 text-center">
                    <div className="text-sm font-semibold text-text-primary">PayGate</div>
                    <div className="text-[10px] text-text-muted mt-0.5">Route · Retry</div>
                  </div>
                </div>
                <div className="flex justify-center my-4">
                  <div className="w-24 h-0.5 bg-border relative">
                    <div className="absolute w-2 h-2 rounded-full bg-accent top-[-3px] animate-pulse-dot" />
                    <div className="absolute w-2 h-2 rounded-full bg-accent top-[-3px] animate-pulse-dot-delay" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {['Stripe', 'Razorpay', 'PayU', 'Braintree'].map((p) => (
                    <div key={p} className="bg-bg-elevated border border-border rounded-md px-4 py-3 text-center text-xs font-semibold text-text-secondary hover:border-border-accent transition-colors">
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── PROVIDER STRIP ── */}
      <section className="border-y border-accent/20 bg-accent-soft py-6 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-accent-soft to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-accent-soft to-transparent z-10" />
        <div className="flex items-center gap-10">
          <span className="text-xs font-semibold tracking-wider uppercase text-accent whitespace-nowrap pl-6 shrink-0">Works with</span>
          <div className="overflow-hidden flex-1 relative">
            <div className="flex gap-14 animate-marquee whitespace-nowrap">
              {[...providers, ...providers, ...providers].map((name, i) => (
                <span key={i} className="text-base font-bold text-text-primary/40 hover:text-text-primary/80 transition-colors duration-300 cursor-default tracking-wide">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { value: '10M+', label: 'Transactions Processed' },
                { value: '99.99%', label: 'Uptime SLA' },
                { value: '<200ms', label: 'Average Routing Latency' },
                { value: '8+', label: 'Payment Providers' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-text-primary font-[family-name:var(--font-display)] tracking-tight">{value}</div>
                  <div className="text-sm text-text-muted mt-1">{label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 md:py-32 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <h2 className="text-3xl sm:text-[44px] font-bold text-text-primary text-center tracking-[-0.02em] font-[family-name:var(--font-display)]">
              Built for both sides of the table
            </h2>
            <p className="text-center text-text-secondary mt-3 mb-16 max-w-xl mx-auto">
              Whether you're shipping the integration or signing off the reports.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Developers */}
            <div>
              <FadeIn>
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="w-4 h-0.5 bg-info rounded-full" />
                  <span className="text-xs font-semibold tracking-wider uppercase text-info">For Developers</span>
                </div>
              </FadeIn>
              {[
                { icon: Code, title: 'Unified REST API', desc: 'One endpoint, all providers. No more juggling multiple SDKs and authentication flows.' },
                { icon: Database, title: 'SDK for Node, Python, Go, PHP', desc: 'Official client libraries with full type support. Install in seconds, not hours.' },
                { icon: Webhook, title: 'Webhook Inspector', desc: 'View, debug, and replay webhook events. Retry failed deliveries with one click.' },
                { icon: Key, title: 'Live API Key Rotation', desc: 'Rotate keys without downtime. Zero-interruption key management for production.' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <FadeIn key={title} delay={i * 0.08}>
                  <div className="bg-surface border border-border rounded-[10px] p-6 mb-4 card-hover group">
                    <div className="w-10 h-10 rounded-lg bg-info-soft flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon size={20} className="text-info" />
                    </div>
                    <h4 className="text-base font-semibold text-text-primary mb-1.5">{title}</h4>
                    <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>

            {/* Finance & Ops */}
            <div>
              <FadeIn>
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="w-4 h-0.5 bg-success rounded-full" />
                  <span className="text-xs font-semibold tracking-wider uppercase text-success">For Finance & Ops</span>
                </div>
              </FadeIn>
              {[
                { icon: BarChart3, title: 'Real-time Transaction Dashboard', desc: 'Every transaction, every provider, one view. Filter, search, and drill into any payment.' },
                { icon: RefreshCw, title: 'Multi-provider Reconciliation', desc: 'Automated reports across Stripe, Razorpay, PayU — no more spreadsheets.' },
                { icon: Shield, title: 'Failure Rate Breakdown', desc: 'See exactly which providers are failing and why. Pinpoint issues before they cascade.' },
                { icon: ArrowUpRight, title: 'Exportable Ledger', desc: 'Download CSV or PDF exports for any date range. Ready for audits and board meetings.' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <FadeIn key={title} delay={i * 0.08}>
                  <div className="bg-surface border border-border rounded-[10px] p-6 mb-4 card-hover group">
                    <div className="w-10 h-10 rounded-lg bg-success-soft flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon size={20} className="text-success" />
                    </div>
                    <h4 className="text-base font-semibold text-text-primary mb-1.5">{title}</h4>
                    <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          <FadeIn>
            <div className="text-center mt-12">
              <Link to="/features" className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-md text-sm font-semibold text-text-secondary hover:border-border-accent hover:text-text-primary transition-all">
                View All Features <ArrowRight size={14} />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 md:py-32 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <h2 className="text-3xl sm:text-[44px] font-bold text-text-primary text-center tracking-[-0.02em] font-[family-name:var(--font-display)]">
              How it works
            </h2>
            <p className="text-center text-text-secondary mt-3 mb-20 max-w-xl mx-auto">
              Three steps from zero to fully orchestrated payments.
            </p>
          </FadeIn>

          {[
            {
              num: '01', title: 'Install PayGate',
              desc: 'Connect via REST API or drop in our SDK. 5 lines of code to go live.',
              visual: (
                <div className="code-block">
                  <div className="header">
                    <div className="dots"><div className="dot" /><div className="dot" /><div className="dot" /></div>
                    <span className="text-xs text-text-muted font-mono">index.js</span>
                  </div>
                  <pre className="p-5 text-sm font-mono text-text-secondary overflow-x-auto leading-relaxed">
{`import { PayGate } from '@paygate/sdk';

const pg = new PayGate('pk_live_...');

const charge = await pg.charges.create({
  amount: 499900,
  currency: 'INR',
  provider: 'auto'
});`}
                  </pre>
                </div>
              ),
            },
            {
              num: '02', title: 'Connect Your Providers',
              desc: 'Add Stripe, Razorpay, PayU — any combination. Set routing rules per currency, region, or transaction value.',
              visual: (
                <div className="grid grid-cols-2 gap-3">
                  {['Stripe', 'Razorpay', 'PayU', 'Braintree'].map((p, i) => (
                    <div key={p} className="bg-surface border border-border rounded-lg px-4 py-3.5 flex items-center justify-between hover:border-accent/30 transition-colors">
                      <span className="text-sm font-semibold text-text-primary">{p}</span>
                      <div className={`w-10 h-[22px] rounded-full relative cursor-pointer transition-colors ${i < 2 || i === 3 ? 'bg-accent' : 'bg-border'}`}>
                        <div className={`absolute w-4 h-4 rounded-full bg-white top-[3px] transition-transform ${i < 2 || i === 3 ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              num: '03', title: 'Go Live & Monitor',
              desc: 'Every transaction is logged, routed, and trackable. Retries happen automatically.',
              visual: (
                <div className="bg-surface border border-border rounded-[10px] p-5">
                  <div className="flex items-end gap-2 h-24 mb-4">
                    {[40, 65, 55, 80, 70, 90, 85].map((h, i) => (
                      <div key={i} className="flex-1 bg-accent rounded-t opacity-60 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Success Rate', value: '97.4%', color: 'text-success' },
                      { label: 'Avg Latency', value: '142ms', color: 'text-text-primary' },
                      { label: 'Active Providers', value: '4', color: 'text-text-primary' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">{label}</span>
                        <span className={`font-mono font-medium ${color}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
          ].map(({ num, title, desc, visual }, i) => (
            <div key={num} className={`grid lg:grid-cols-2 gap-12 items-center mb-24 last:mb-0`}>
              <FadeIn className={i % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold text-accent/60 font-mono">{num}</span>
                  <span className="w-8 h-px bg-accent/30" />
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-3 font-[family-name:var(--font-display)]">{title}</h3>
                <p className="text-base text-text-secondary leading-relaxed">{desc}</p>
              </FadeIn>
              <FadeIn delay={0.15} className={i % 2 === 1 ? 'lg:order-1' : ''}>
                {visual}
              </FadeIn>
            </div>
          ))}
        </div>
      </section>

      {/* ── API DOCS PREVIEW ── */}
      <section className="py-24 md:py-32 border-t border-border/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="bg-surface border border-border rounded-[10px] overflow-hidden grid lg:grid-cols-[200px_1fr] shadow-xl shadow-black/[0.03]">
              <nav className="border-r border-border p-5 hidden lg:block">
                {['Quickstart', 'Authentication', 'Endpoints', 'Webhooks', 'Errors'].map((s, i) => (
                  <div key={s} className={`block px-3 py-2.5 rounded-md text-sm font-medium mb-1 ${i === 0 ? 'text-accent bg-accent/5 border-l-2 border-accent' : 'text-text-muted'}`}>
                    {s}
                  </div>
                ))}
              </nav>
              <div className="p-8">
                <h3 className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)] mb-1">Create a Charge</h3>
                <code className="text-xs font-mono text-accent mb-5 inline-block">POST /v1/charges</code>
                <div className="code-block">
                  <pre className="p-5 text-sm font-mono text-text-secondary overflow-x-auto leading-relaxed">
{`curl -X POST https://api.paygate.dev/v1/charges \\
  -H "Authorization: Bearer pk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 499900,
    "currency": "INR",
    "description": "Order #1234"
  }'`}
                  </pre>
                </div>
                <Link to="/docs" className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-accent hover:gap-2.5 transition-all">
                  View Full Documentation <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 md:py-32 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <h2 className="text-3xl sm:text-[44px] font-bold text-text-primary text-center tracking-[-0.02em] font-[family-name:var(--font-display)]">
              Trusted by engineering teams
            </h2>
            <p className="text-center text-text-secondary mt-3 mb-16">Companies that moved to PayGate and never looked back.</p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { company: 'FinStack', role: 'Priya S., VP Engineering', quote: 'PayGate cut our payment failure rate by 34% in the first month. The intelligent retry logic alone justified the switch.' },
              { company: 'Kredify', role: 'Arjun M., CTO', quote: 'Our finance team finally stopped asking me for transaction exports. The reconciliation dashboard does it all.' },
              { company: 'Movo', role: 'Sarah L., Lead Developer', quote: 'We went from 3 payment integrations to 1 in a weekend. The SDK is clean, the docs are excellent.' },
            ].map(({ company, role, quote }, i) => (
              <FadeIn key={company} delay={i * 0.1}>
                <div className="bg-surface border border-border rounded-[10px] p-7 card-hover h-full flex flex-col">
                  <div className="text-base font-bold text-text-primary mb-1">{company}</div>
                  <div className="text-xs text-text-muted mb-5">{role}</div>
                  <p className="text-sm text-text-secondary leading-relaxed italic flex-1">"{quote}"</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM ── */}
      <section className="py-24 md:py-32 border-t border-border/30" id="contact">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-16 items-start">
          <FadeIn>
            <h2 className="text-3xl sm:text-[36px] font-bold text-text-primary tracking-[-0.02em] font-[family-name:var(--font-display)] mb-4">
              Ready to orchestrate your payments?
            </h2>
            <p className="text-base text-text-secondary leading-relaxed mb-4">
              Get API access, talk to our team, or request a demo. We respond within 1 business day.
            </p>
            <p className="text-sm text-text-muted">No sales pressure. Just a conversation about your stack.</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Thank you! We will be in touch.') }}>
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block">Full Name</label>
                <input type="text" required placeholder="Priya Sharma"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block">Work Email</label>
                <input type="email" required placeholder="priya@company.com"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block">Company</label>
                <input type="text" required placeholder="Acme Corp"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block">Role</label>
                <select required className="w-full px-4 py-2.5 bg-surface border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all">
                  <option value="" disabled selected>Select your role</option>
                  <option value="developer">Developer</option>
                  <option value="finance">Finance / Ops</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block">Message</label>
                <textarea rows={3} placeholder="Tell us about your payment stack..."
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all resize-y" />
              </div>
              <button type="submit" className="w-full py-3.5 bg-accent hover:bg-accent-hover text-white rounded-md font-semibold text-sm transition-all active:scale-[0.97]">
                Request Access
              </button>
            </form>
          </FadeIn>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 border-t border-border/30 bg-accent-soft">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <h2 className="text-2xl sm:text-[36px] font-bold text-text-primary font-[family-name:var(--font-display)] tracking-[-0.02em] mb-3">
              Your payment stack is already complex enough.
            </h2>
            <p className="text-base text-text-secondary mb-8">PayGate doesn't add to it. It sits on top.</p>
            <Link to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-hover text-white rounded-md font-semibold transition-all active:scale-[0.97] shadow-lg shadow-accent/20">
              Get API Access
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {[
              { title: 'Product', links: [{ label: 'Features', to: '/features' }, { label: 'API Docs', to: '/docs' }, { label: 'Pricing', to: '/pricing' }, { label: 'Integrations', to: '/features' }] },
              { title: 'Developers', links: [{ label: 'Documentation', to: '/docs' }, { label: 'Quickstart', to: '/docs' }, { label: 'SDK Reference', to: '/docs' }, { label: 'Status', to: '#' }] },
              { title: 'Company', links: [{ label: 'About', to: '#' }, { label: 'Blog', to: '#' }, { label: 'Contact', to: '/contact' }, { label: 'Careers', to: '#' }] },
              { title: 'Legal', links: [{ label: 'Privacy Policy', to: '#' }, { label: 'Terms of Service', to: '#' }, { label: 'Security', to: '#' }] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h5 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">{title}</h5>
                {links.map((l) => (
                  <Link key={l.label} to={l.to} className="block text-sm text-text-muted hover:text-text-secondary transition-colors py-1">{l.label}</Link>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-border gap-4">
            <span className="text-sm text-text-muted">&copy; {new Date().getFullYear()} PayGate. All rights reserved.</span>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span className="w-2 h-2 rounded-full bg-success" />
              Status: Operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
