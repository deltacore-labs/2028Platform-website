import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { ForcePasswordChange } from './ForcePasswordChange'

const navItems = [
  { to: '/admin/overview', label: 'Übersicht', icon: '◫', roles: ['miniteam', 'leader', 'admin'] },
  { to: '/admin/emergency', label: 'Notfall', icon: '⚡', roles: ['miniteam', 'admin'] },
  { to: '/admin/announcements', label: 'Ankündigungen', icon: '◎', roles: ['miniteam', 'leader', 'admin'] },
  { to: '/admin/events', label: 'Veranstaltungen', icon: '◷', roles: ['miniteam', 'leader', 'admin'] },
  { to: '/admin/users', label: 'Nutzer', icon: '◈', roles: ['miniteam', 'admin'] },
  { to: '/admin/groups', label: 'Gruppen', icon: '◉', roles: ['miniteam', 'admin'] },
  { to: '/admin/dioceses', label: 'Bistümer', icon: '◇', roles: ['admin'] },
] as const

export function Layout() {
  const { appUser } = useAuth()
  const role = appUser?.role ?? 'participant'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (appUser?.mustChangePassword) {
    return <ForcePasswordChange />
  }

  const visibleItems = navItems.filter(item =>
    (item.roles as readonly string[]).includes(role)
  )

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-56 bg-canvas border-r border-hairline flex flex-col shrink-0 transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-hairline flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-ink-warm flex items-center justify-center text-white text-xs font-semibold">
                ✞
              </div>
              <div>
                <p className="font-display text-[17px] font-normal text-ink leading-tight" style={{ fontWeight: 300 }}>
                  Rom 2028
                </p>
              </div>
            </div>
            <p className="text-muted-soft text-[11px] mt-1 tracking-[0.6px] uppercase font-medium ml-9">
              Admin
            </p>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-muted hover:text-ink p-1 -mr-1 transition-colors"
            aria-label="Menü schließen"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-pill text-[15px] font-medium transition-colors ${
                  isActive
                    ? 'bg-ink-warm text-white'
                    : 'text-body hover:text-ink hover:bg-hairline-soft'
                }`
              }
            >
              <span className="text-[13px] opacity-70">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-hairline space-y-1">
          {appUser?.name && (
            <p className="px-3 text-[13px] text-muted truncate">{appUser.name}</p>
          )}
          <button
            onClick={() => signOut(auth)}
            className="w-full text-left px-3 py-2 rounded-pill text-[15px] font-medium text-body hover:text-ink hover:bg-hairline-soft transition-colors"
          >
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3.5 bg-canvas border-b border-hairline md:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-body hover:text-ink transition-colors p-1 -ml-1"
            aria-label="Menü öffnen"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="5" x2="18" y2="5" />
              <line x1="2" y1="10" x2="18" y2="10" />
              <line x1="2" y1="15" x2="18" y2="15" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-ink-warm flex items-center justify-center text-white text-[10px]">
              ✞
            </div>
            <span className="font-display text-[17px] text-ink" style={{ fontWeight: 300 }}>
              Rom 2028
            </span>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  )
}
