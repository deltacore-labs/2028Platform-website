import { NavLink, Outlet } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/emergency', label: '🚨 Notfall', roles: ['miniteam'] },
  { to: '/announcements', label: '📢 Ankündigungen', roles: ['miniteam', 'leader'] },
  { to: '/users', label: '👥 Nutzer', roles: ['miniteam'] },
  { to: '/groups', label: '🏕️ Gruppen', roles: ['miniteam'] },
] as const

export function Layout() {
  const { appUser } = useAuth()
  const role = appUser?.role ?? 'participant'

  const visibleItems = navItems.filter(item =>
    (item.roles as readonly string[]).includes(role)
  )

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <h1 className="text-white font-bold text-lg">Rom 2028</h1>
          <p className="text-slate-500 text-xs mt-0.5">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <p className="text-slate-500 text-xs px-3 mb-2 truncate">{appUser?.name ?? ''}</p>
          <button
            onClick={() => signOut(auth)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Abmelden
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
