import { Link } from 'react-router-dom'
import {
  ArrowRight, BookOpen, Code, Shield, ArrowUpRight,
} from 'lucide-react'

const Landing = () => {
  const token = localStorage.getItem('token')

  return (
    <div className="min-h-screen bg-bg-primary">
      <nav className="glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-lg font-bold text-text-primary tracking-tight">PayGate</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/docs" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Docs</Link>
              <Link to="/features" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Features</Link>
              {token ? (
                <Link to="/dashboard"
                  className="px-5 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-accent/20 inline-flex items-center gap-2">
                  Dashboard <ArrowRight size={14} />
                </Link>
              ) : (
                <Link to="/login"
                  className="px-5 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-accent/20">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="py-20 md:py-28 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary tracking-tight mb-6">
            Internal Payment <span className="gradient-text">Infrastructure</span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10">
            One integration. One dashboard. One set of keys. Every product in your ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {token ? (
              <Link to="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold transition-all shadow-xl shadow-accent/25 group">
                Go to Dashboard <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold transition-all shadow-xl shadow-accent/25">
                Sign in to Dashboard
              </Link>
            )}
            <Link to="/docs"
              className="inline-flex items-center gap-2 px-8 py-4 border border-border hover:border-accent/50 text-text-primary rounded-xl font-medium transition-all">
              <BookOpen size={16} /> API Reference
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: BookOpen, title: 'Documentation',
                desc: 'Quick-start guides, API references, SDK docs, and integration tutorials.',
                link: '/docs', color: 'from-accent to-purple-500',
              },
              {
                icon: Code, title: 'API Reference',
                desc: 'Complete API reference for payments, webhooks, authentication, and more.',
                link: '/docs', color: 'from-purple-500 to-pink-500',
              },
              {
                icon: Shield, title: 'Features',
                desc: 'API key auth, double-entry ledger, webhooks, multi-app isolation, and more.',
                link: '/features', color: 'from-cyan-500 to-blue-500',
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

      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <span className="text-sm text-text-muted">&copy; {new Date().getFullYear()} PayGate</span>
          <div className="flex items-center gap-4">
            <Link to="/docs" className="text-sm text-text-muted hover:text-text-secondary transition-colors">Docs</Link>
            <Link to="/features" className="text-sm text-text-muted hover:text-text-secondary transition-colors">Features</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
