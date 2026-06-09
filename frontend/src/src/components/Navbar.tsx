import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Webhook, Settings, LogOut, Bell, Search, ChevronDown, Menu, X } from 'lucide-react'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { path: '/webhooks', label: 'Webhooks', icon: Webhook },
    { path: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="sticky top-0 z-40 glass border-b border-border/50 shadow-lg shadow-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-lg font-bold text-text-primary tracking-tight hidden sm:block">PayGate</span>
            </Link>

            <div className="hidden lg:flex items-center bg-slate-900/50 border border-border/50 rounded-xl px-3 py-1.5 w-64">
              <Search size={14} className="text-text-muted shrink-0" />
              <input type="text" placeholder="Search transactions..."
                className="ml-2 bg-transparent border-0 text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full" />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link key={link.path} to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent/10 text-accent shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}>
                  <link.icon size={16} />
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-xl hover:bg-white/5 transition-all">
              <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center text-xs font-bold text-accent">JM</div>
              <span className="font-medium">JioMart</span>
              <ChevronDown size={12} />
            </button>

            <button className="relative p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-white/5 transition-all">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
            </button>

            <button onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut size={16} />
              Logout
            </button>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-text-secondary hover:text-text-primary">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass border-t border-border/50">
          <div className="px-4 py-3 space-y-1">
            <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-900/50 border border-border/50 rounded-xl mb-3">
              <Search size={14} className="text-text-muted" />
              <input type="text" placeholder="Search..."
                className="bg-transparent border-0 text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-full" />
            </div>
            {links.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}>
                  <link.icon size={16} />
                  {link.label}
                </Link>
              )
            })}
            <hr className="border-border/50 my-2" />
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all w-full">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
