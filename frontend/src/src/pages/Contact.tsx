import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

const Contact = () => {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Navbar */}
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
              <Link to="/pricing" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-black/[0.03]">Pricing</Link>
              <span className="px-4 py-2 text-sm font-medium text-text-muted/50 cursor-default">Changelog</span>
              <span className="px-4 py-2 text-sm font-medium text-text-muted/50 cursor-default">Status</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/contact" className="hidden sm:inline-flex px-4 py-2 border border-accent/40 bg-accent/5 rounded-md text-sm font-medium text-accent transition-all">Contact Sales</Link>
              <Link to="/register" className="px-5 py-2 bg-accent hover:bg-accent-hover rounded-md text-sm font-semibold text-white transition-all active:scale-[0.97]">Get API Access</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <h1 className="text-3xl sm:text-[44px] font-bold text-text-primary tracking-[-0.02em] font-[family-name:var(--font-display)] mb-4">
              Talk to our team
            </h1>
            <p className="text-base text-text-secondary leading-relaxed mb-6">
              Whether you're evaluating PayGate for your team or need a custom enterprise plan, we're here to help.
            </p>
            <div className="space-y-4 mb-8">
              {[
                'Get API access and onboarding guidance',
                'Custom pricing for high-volume businesses',
                'Technical consultation for your integration',
                'SLA and security compliance details',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-accent shrink-0 mt-0.5" />
                  <span className="text-sm text-text-secondary">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-text-muted">We respond within 1 business day. No sales pressure.</p>
          </div>

          <div>
            {submitted ? (
              <div className="bg-surface border border-border rounded-[10px] p-10 text-center">
                <div className="w-16 h-16 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={32} className="text-success" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)] mb-2">Thank you</h2>
                <p className="text-text-secondary mb-6">We've received your message. Our team will reach out within 1 business day.</p>
                <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-md font-semibold text-sm transition-all">
                  Back to Home
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-[10px] p-8 space-y-5">
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1.5 block">Full Name *</label>
                  <input type="text" required placeholder="Priya Sharma"
                    className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1.5 block">Work Email *</label>
                  <input type="email" required placeholder="priya@company.com"
                    className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1.5 block">Company *</label>
                  <input type="text" required placeholder="Acme Corp"
                    className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1.5 block">Role *</label>
                  <select required className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent transition-colors">
                    <option value="" disabled selected>Select your role</option>
                    <option value="developer">Developer</option>
                    <option value="finance">Finance / Ops</option>
                    <option value="cto">CTO / Engineering Lead</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1.5 block">Monthly Transaction Volume</label>
                  <select className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent transition-colors">
                    <option value="" disabled selected>Select range</option>
                    <option value="under-1k">Under 1,000</option>
                    <option value="1k-10k">1,000 - 10,000</option>
                    <option value="10k-50k">10,000 - 50,000</option>
                    <option value="50k-100k">50,000 - 100,000</option>
                    <option value="100k+">100,000+</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1.5 block">Message</label>
                  <textarea rows={3} placeholder="Tell us about your payment stack and what you're looking for..."
                    className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-y" />
                </div>
                <button type="submit" className="w-full py-3.5 bg-accent hover:bg-accent-hover text-white rounded-md font-semibold text-sm transition-all active:scale-[0.97]">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <span className="text-sm text-text-muted">&copy; {new Date().getFullYear()} PayGate. All rights reserved.</span>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span className="w-2 h-2 rounded-full bg-success" />
            Status: Operational
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Contact
