import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Webhook, Settings, LogOut, BookOpen, Menu, X, ChevronDown, Bell } from 'lucide-react'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const hasToken = document.cookie.split('; ').some(c => c.startsWith('token='))

  const handleLogout = () => {
    document.cookie = 'token=; path=/; max-age=0'
    navigate('/')
  }

  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { path: '/webhooks', label: 'Webhooks', icon: Webhook },
    { path: '/docs', label: 'Docs', icon: BookOpen },
  ]

  if (hasToken) {
    links.push({ path: '/settings', label: 'Settings', icon: Settings })
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-border/50 bg-bg-primary/85 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to={hasToken ? '/dashboard' : '/'} className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 bg-text-primary rotate-45 rounded-sm" />
                <span className="relative text-white font-bold text-sm font-[family-name:var(--font-display)]">P</span>
              </div>
              <span className="text-lg font-bold text-text-primary tracking-tight hidden sm:block font-[family-name:var(--font-display)]">PayGate</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link key={link.path} to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-black/[0.03]'
                  }`}>
                  <link.icon size={16} />
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            {hasToken && (
              <>
                <button className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-md hover:bg-black/[0.03] transition-all">
                  <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center text-xs font-bold text-accent">AC</div>
                  <span className="font-medium">Acme Corp</span>
                  <ChevronDown size={12} />
                </button>

                <button className="relative p-2 text-text-secondary hover:text-text-primary rounded-md hover:bg-black/[0.03] transition-all">
                  <Bell size={18} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
                </button>

                <button onClick={handleLogout}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger/10 transition-all">
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            )}
            {!hasToken && (
              <Link to="/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-md hover:bg-black/[0.03] transition-all">
                Sign in
              </Link>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-text-secondary hover:text-text-primary">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-bg-primary/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-all ${
                    isActive ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-black/[0.03]'
                  }`}>
                  <link.icon size={16} />
                  {link.label}
                </Link>
              )
            })}
            {hasToken && (
              <>
                <hr className="border-border/50 my-2" />
                <button onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger/10 transition-all w-full">
                  <LogOut size={16} /> Logout
                </button>
              </>
            )}
            {!hasToken && (
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-accent bg-accent/10 transition-all w-full">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
