import { useState, useEffect } from 'react'

import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import type { RootState, AppDispatch } from '../store'
import { switchActiveApp, logoutSingleApp } from '../toolkit/user-redux-toll/user-redux'
import type { AppInfo } from '../services/auth.service'
import { ChevronDown, Check, LogOut, Plus, AlertTriangle, Clock } from 'lucide-react'

const AppSwitcher = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { activeApp, userApps } = useSelector((state: RootState) => state.user)
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!activeApp || userApps.length === 0) return null

  const formatTimeLeft = (expiresAt: number): string => {
    const diff = expiresAt - now;
    if (diff <= 0) return 'Expired'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d left`
    }
    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
  }

  const handleSwitch = async (app: AppInfo) => {
    if (app.appId === activeApp) {
      setOpen(false)
      return
    }

    if (app.expired) {
      setOpen(false)
      navigate('/login')
      return
    }

    const result = await dispatch(switchActiveApp(app.appId))
    if (switchActiveApp.fulfilled.match(result)) {
      setOpen(false)
      window.location.reload()
    } else {
      // Switch failed (likely token expired between check and switch)
      setOpen(false)
      navigate('/login')
    }
  }

  const handleRemove = async (e: React.MouseEvent, appId: string) => {
    e.stopPropagation()
    if (confirm(`Remove app ${appId.slice(0, 8)}... from session?`)) {
      const result = await dispatch(logoutSingleApp(appId))
      if (logoutSingleApp.fulfilled.match(result)) {
        if (!result.payload.result.activeApp && result.payload.result.authenticated === false) {
          navigate('/login')
        } else {
          window.location.reload()
        }
      }
    }
    setOpen(false)
  }

  const handleAddNew = () => {
    navigate('/login')
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
      >
        <div className="w-6 h-6 bg-accent/10 rounded flex items-center justify-center">
          <span className="text-xs font-bold text-accent">{activeApp.slice(0, 2).toUpperCase()}</span>
        </div>
        <span className="hidden sm:block max-w-[100px] truncate font-mono text-xs">{activeApp}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-[10px] shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-border">
              <p className="text-xs text-text-muted">Switch App ({userApps.length} in session)</p>
            </div>

            <div className="p-2 max-h-60 overflow-y-auto">
              {userApps.map((app) => (
                <button
                  key={app.appId}
                  onClick={() => handleSwitch(app)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                    app.appId === activeApp
                      ? 'bg-accent/10 text-accent'
                      : app.expired
                        ? 'text-text-muted hover:bg-bg-elevated'
                        : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                  }`}
                >
                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                    app.appId === activeApp ? 'bg-accent/20' : 'bg-bg-elevated'
                  }`}>
                    <span className="text-xs font-bold">{app.appId.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-mono text-xs truncate">{app.appId}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {app.expired ? (
                        <span className="flex items-center gap-1 text-xs text-danger">
                          <AlertTriangle size={10} />
                          Expired — click to re-login
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <Clock size={10} />
                          {formatTimeLeft(app.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  {app.appId === activeApp && <Check size={14} className="text-accent shrink-0" />}
                  {app.appId !== activeApp && !app.expired && (
                    <button
                      onClick={(e) => handleRemove(e, app.appId)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-danger/10 rounded transition-all shrink-0"
                      title="Remove from session"
                    >
                      <LogOut size={12} className="text-danger" />
                    </button>
                  )}
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-border">
              <button
                onClick={handleAddNew}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-all"
              >
                <div className="w-8 h-8 rounded flex items-center justify-center bg-success-soft">
                  <Plus size={14} className="text-success" />
                </div>
                <span>Add another app</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AppSwitcher
