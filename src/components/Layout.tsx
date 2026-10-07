import { NavLink, Outlet } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/admin/emergency', label: '🚨 Notfall', roles: ['miniteam'] },
  { to: '/admin/announcements', label: '📢 Ankündigungen', roles: ['miniteam', 'leader'] },
  { to: '/admin/users', label: '👥 Nutzer', roles: ['miniteam'] },
  { to: '/admin/groups', label: '🏕️ Gruppen', roles: ['miniteam'] },
] as const

export function Layout() {
  const { appUser } = useAuth()
  const role = appUser?.role ?? 'participant'

  const visibleItems = navItems.filter(item =>
    (item.roles as readonly string[]).includes(role)
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-red-800 border-r border-red-700/40 flex flex-col">
        <div className="p-5 border-b border-red-700/40">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-red-800 font-bold text-xs">
              ✞
            </div>
            <h1 className="text-white font-bold text-base">Rom 2028</h1>
          </div>
          <p className="text-red-200/60 text-xs mt-0.5 pl-8">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'text-red-100/70 hover:bg-red-700/60 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-red-700/40">
          <p className="text-red-200/50 text-xs px-3 mb-2 truncate">{appUser?.name ?? ''}</p>
          <button
            onClick={() => signOut(auth)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-100/70 hover:bg-red-700/60 hover:text-white transition-colors"
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
