import { NavLink, Outlet } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { ForcePasswordChange } from './ForcePasswordChange'

const navItems = [
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

  if (appUser?.mustChangePassword) {
    return <ForcePasswordChange />
  }

  const visibleItems = navItems.filter(item =>
    (item.roles as readonly string[]).includes(role)
  )

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Sidebar */}
      <aside className="w-56 bg-canvas border-r border-hairline flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-hairline">
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

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
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
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
