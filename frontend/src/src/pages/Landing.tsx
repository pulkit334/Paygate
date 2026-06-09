import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Zap, BarChart3, Shield, Lock,
  Menu, X, Layers, ArrowUpRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const navLinks = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
]

const LandingNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'glass shadow-lg shadow-black/10' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-xl font-bold text-text-primary tracking-tight">PayGate</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.href}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/5 transition-all">
                {link.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-border mx-2" />
            <Link to="/login"
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/5 transition-all">
              Sign in
            </Link>
            <Link to="/register"
              className="px-5 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-accent/20 hover:shadow-accent/30 inline-flex items-center gap-2">
              Get Started <ArrowRight size={14} />
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-text-secondary hover:text-text-primary">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass border-t border-border/50">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.href} onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/5 transition-all">
                {link.label}
              </Link>
            ))}
            <hr className="border-border/50 my-3" />
            <Link to="/login" onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/5 transition-all">
              Sign in
            </Link>
            <Link to="/register" onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 bg-accent text-white rounded-xl text-center font-medium transition-all">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

const HeroSection = () => (
  <section className="relative min-h-screen hero-gradient flex items-center overflow-hidden pt-20">
    <div className="absolute inset-0 grid-pattern opacity-50" />
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" />
    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 relative z-10">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-light border border-accent/20 rounded-full text-accent text-sm font-medium mb-8">
            <Zap size={14} />
            Now in Public Beta
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1]">
            One payment infrastructure.{' '}
            <span className="gradient-text">Every app.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-text-secondary leading-relaxed max-w-xl">
            PayGate is the internal payment orchestration layer for companies with multiple apps.
            One integration. One dashboard. One set of keys. Every product in your ecosystem.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold transition-all shadow-xl shadow-accent/25 hover:shadow-accent/40 text-lg group">
              Get Started Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/docs"
              className="inline-flex items-center gap-2 px-8 py-4 border border-border hover:border-accent/50 text-text-primary rounded-xl font-medium transition-all text-lg">
              <BookOpen size={16} /> Read the Docs
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-text-muted">
            {['No credit card', '30-day free trial', 'Cancel anytime'].map((text) => (
              <div key={text} className="flex items-center gap-2">
                <Check size={14} className="text-success" />
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:block animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-accent/20 via-purple-500/10 to-transparent rounded-3xl blur-2xl" />
            <div className="relative bg-slate-900/80 border border-border/50 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
                <div className="flex gap-1.5">
                  {['bg-red-500/80', 'bg-yellow-500/80', 'bg-green-500/80'].map((c, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${c}`} />
                  ))}
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-text-muted font-mono">dashboard.paygate.io</span>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                      <BarChart3 size={16} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Total Volume</p>
                      <p className="text-lg font-bold text-text-primary">₹1.25 Cr</p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs font-medium">
                    +12.5%
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Transactions', value: '2,348', change: '+8.2%' },
                    { label: 'Success Rate', value: '98.7%', change: '+0.3%' },
                    { label: 'Avg. Response', value: '124ms', change: '-12ms' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-slate-800/50 rounded-xl p-3 border border-border/30">
                      <p className="text-xs text-text-muted">{stat.label}</p>
                      <p className="text-base font-bold text-text-primary mt-1">{stat.value}</p>
                      <p className="text-xs text-success mt-0.5">{stat.change}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-border/30">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-text-secondary">Recent Transactions</p>
                    <Link to="/dashboard" className="text-xs text-accent hover:underline">View all →</Link>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { name: 'JioMart #ORD-3842', amount: '₹12,499', status: 'Success' },
                      { name: 'JioCinema #ORD-3841', amount: '₹499', status: 'Success' },
                      { name: 'JioFiber #ORD-3840', amount: '₹2,999', status: 'Failed' },
                    ].map((txn, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${txn.status === 'Success' ? 'bg-success' : 'bg-danger'}`} />
                          <span className="text-sm text-text-primary font-mono">{txn.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-text-primary font-medium">{txn.amount}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            txn.status === 'Success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>{txn.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-accent to-purple-500 rounded-full animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, #6366f1, #a78bfa, #6366f1)' }} />
                  </div>
                  <span className="text-xs text-text-muted whitespace-nowrap">74% API quota used</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

function BookOpen(props: any) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
}

const TrustBar = () => (
  <section className="py-16 border-y border-border/30 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <p className="text-center text-sm font-medium text-text-muted uppercase tracking-widest mb-10">
        Trusted by engineering teams at
      </p>
      <div className="relative overflow-hidden">
        <div className="flex gap-16 animate-marquee w-max">
          {Array.from({ length: 2 }).map((_, groupIdx) => (
            <div key={groupIdx} className="flex items-center gap-16">
              {['JioMart', 'JioCinema', 'JioFiber', 'JioSaavn', 'JioMeet', 'JioCloud', 'JioPay', 'JioAds'].map((name) => (
                <div key={name} className="flex items-center gap-3 text-text-muted hover:text-text-secondary transition-colors">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Layers size={16} className="text-accent" />
                  </div>
                  <span className="text-lg font-bold tracking-tight whitespace-nowrap">{name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
)

const QuickStats = () => (
  <section className="py-20 bg-gradient-to-b from-accent/5 to-transparent">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
        {[
          { icon: BarChart3, value: '₹150Cr+', label: 'Processed Volume' },
          { icon: ActivityIcon, value: '10M+', label: 'Transactions' },
          { icon: AppIcon, value: '50+', label: 'Active Apps' },
          { icon: Shield, value: '99.99%', label: 'Uptime SLA' },
        ].map((stat) => (
          <div key={stat.label} className="group">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
              <stat.icon size={24} className="text-accent" />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-sm text-text-muted mt-2">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
)

function ActivityIcon(props: any) { return <BarChart3 {...props} /> }
function AppIcon(props: any) { return <Layers {...props} /> }

const QuickLinks = () => (
  <section className="py-20 md:py-28">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
          Explore <span className="gradient-text">PayGate</span>
        </h2>
        <p className="mt-5 text-lg text-text-secondary">
          Everything you need to unify your payment infrastructure across every app.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            icon: Zap, title: 'Features', desc: 'API key auth, double-entry ledger, webhooks, multi-app isolation, and more.',
            link: '/features', color: 'from-accent to-purple-500',
          },
          {
            icon: Shield, title: 'Pricing', desc: 'Start free. Scale as you grow. Transparent pricing with no hidden fees.',
            link: '/pricing', color: 'from-purple-500 to-pink-500',
          },
          {
            icon: BookOpen, title: 'Documentation', desc: 'Quick-start guides, API references, SDK docs, and integration tutorials.',
            link: '/docs', color: 'from-cyan-500 to-blue-500',
          },
        ].map((item) => (
          <Link key={item.title} to={item.link}
            className="group glass-light rounded-2xl p-8 card-hover">
            <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-5 shadow-lg`}>
              <item.icon size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">{item.title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-5">{item.desc}</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent group-hover:gap-2.5 transition-all">
              Learn more <ArrowUpRight size={14} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  </section>
)

const CtaSection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-purple-500/10 to-transparent" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

    <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-6">
        Ready to unify your{' '}
        <span className="gradient-text">payment infrastructure</span>?
      </h2>
      <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10">
        Join the engineering teams that have already streamlined payments across 50+ apps.
        Start free — no credit card required.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link to="/register"
          className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold transition-all shadow-xl shadow-accent/25 hover:shadow-accent/40 text-lg group">
          Start Free Trial
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link to="/features"
          className="inline-flex items-center gap-2 px-8 py-4 border border-border hover:border-accent/50 text-text-primary rounded-xl font-medium transition-all text-lg">
          Explore Features
        </Link>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted">
        {['No credit card required', '30-day free trial', 'Cancel anytime', '99.99% uptime SLA'].map((text) => (
          <div key={text} className="flex items-center gap-2">
            <Check size={14} className="text-success" />
            {text}
          </div>
        ))}
      </div>
    </div>
  </section>
)

const Footer = () => {
  const footerLinks = {
    Platform: ['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'],
    Developers: ['Documentation', 'API Reference', 'SDKs', 'Tutorials', 'Status'],
    Company: ['About', 'Blog', 'Careers', 'Press', 'Contact'],
    Legal: ['Privacy', 'Terms', 'Security', 'Cookies', 'GDPR'],
  }

  return (
    <footer className="border-t border-border/50 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-lg font-bold text-text-primary">PayGate</span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed mb-6 max-w-xs">
              The payment orchestration layer for companies with multiple apps. One infrastructure, every product.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-text-primary mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link to={link === 'Features' ? '/features' : link === 'Pricing' ? '/pricing' : link === 'Documentation' ? '/docs' : '#'}
                      className="text-sm text-text-muted hover:text-text-secondary transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border/30 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted">&copy; {new Date().getFullYear()} PayGate. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {[
              { icon: Shield, text: 'SOC 2 Compliant' },
              { icon: Lock, text: 'AES-256 Encrypted' },
              { icon: Check, text: 'ISO 27001 Certified' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-xs text-text-muted">
                <item.icon size={12} className="text-success" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

const Landing = () => {
  return (
    <div className="min-h-screen bg-bg-primary">
      <LandingNavbar />
      <HeroSection />
      <TrustBar />
      <QuickStats />
      <QuickLinks />
      <CtaSection />
      <Footer />
    </div>
  )
}

export default Landing
