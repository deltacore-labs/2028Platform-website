import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { fetchEmergencyReports } from '../api/emergency'
import { useAuth } from '../context/AuthContext'
import { EmergencyAlert } from './EmergencyAlert'
import { ForcePasswordChange } from './ForcePasswordChange'

type IconName = 'overview' | 'emergency' | 'announcements' | 'events' | 'locations' | 'users' | 'groups'

const navSections = [
  {
    label: 'Arbeitsbereich',
    items: [
      { to: '/admin/overview', label: 'Übersicht', icon: 'overview', roles: ['miniteam', 'leader', 'admin'] },
      { to: '/admin/emergency', label: 'Notfälle', icon: 'emergency', roles: ['malteser', 'miniteam', 'admin'] },
    ],
  },
  {
    label: 'Inhalte',
    items: [
      { to: '/admin/announcements', label: 'Ankündigungen', icon: 'announcements', roles: ['miniteam', 'leader', 'admin'] },
      { to: '/admin/events', label: 'Veranstaltungen', icon: 'events', roles: ['miniteam', 'leader', 'admin'] },
    ],
  },
  {
    label: 'Organisation',
    items: [
      { to: '/admin/users', label: 'Nutzer', icon: 'users', roles: ['miniteam', 'admin'] },
      { to: '/admin/groups', label: 'Gruppen', icon: 'groups', roles: ['miniteam', 'admin'] },
    ],
  },
] as const

const roleLabels = {
  participant: 'Teilnehmer',
  leader: 'Gruppenleitung',
  miniteam: 'Miniteam',
  malteser: 'Malteser',
  admin: 'Administration',
} as const

function Icon({ name, className = 'h-[18px] w-[18px]' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    emergency: <path d="M13 2 4.7 13h6.8l-.5 9L19.3 11h-6.8L13 2Z" />,
    announcements: (
      <>
        <path d="m4 13 1.2 5.2a2 2 0 0 0 2 1.6h.9a2 2 0 0 0 1.9-2.6L9 14" />
        <path d="M4 13h3l9 4V5L7 9H4a2 2 0 0 0-2 2 2 2 0 0 0 2 2Z" />
        <path d="M20 8.5a4 4 0 0 1 0 5" />
      </>
    ),
    events: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18" />
        <path d="m8 15 2 2 5-5" />
      </>
    ),
    locations: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
    groups: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20v-1.5A4.5 4.5 0 0 1 8 14h2a4.5 4.5 0 0 1 4.5 4.5V20" />
        <circle cx="17.5" cy="7.5" r="2.5" />
        <path d="M16 13h1.5a4 4 0 0 1 4 4v1" />
      </>
    ),
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

export function Layout() {
  const { appUser } = useAuth()
  const { pathname } = useLocation()
  const role = appUser?.role ?? 'participant'
  const canSeeEmergencies = role === 'malteser' || role === 'miniteam' || role === 'admin'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: emergencyReports = [] } = useQuery({
    queryKey: ['emergency'],
    queryFn: fetchEmergencyReports,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    enabled: canSeeEmergencies,
  })
  const activeEmergencyCount = emergencyReports.filter(report => report.status !== 'resolved').length

  useEffect(() => {
    if (!mobileMenuOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [mobileMenuOpen])

  if (appUser?.mustChangePassword) {
    return <ForcePasswordChange />
  }

  const visibleSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => (item.roles as readonly string[]).includes(role)),
    }))
    .filter(section => section.items.length > 0)

  const currentItem = visibleSections.flatMap(section => section.items).find(item => pathname.startsWith(item.to))
  const initials = appUser?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'R'

  return (
    <div className="flex min-h-dvh bg-canvas">
      <EmergencyAlert />

      <button
        type="button"
        className={`fixed inset-0 z-20 bg-ink/25 backdrop-blur-[2px] transition-opacity duration-200 md:hidden ${
          mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-label="Menü schließen"
        tabIndex={mobileMenuOpen ? 0 : -1}
      />

      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-30 flex w-[272px] shrink-0 flex-col border-r border-hairline bg-canvas-soft shadow-[12px_0_40px_rgba(12,10,9,0.08)] transition-transform duration-200 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] md:sticky md:top-0 md:h-dvh md:translate-x-0 md:shadow-none ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Hauptnavigation"
      >
        <div className="flex items-center justify-between px-5 pb-4 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] md:pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-warm text-white shadow-[0_4px_12px_rgba(41,37,36,0.18)]">
              <span className="font-display text-[22px] leading-none">✞</span>
            </div>
            <div className="min-w-0">
              <p className="font-display text-[21px] font-light leading-none text-ink">Rom 2028</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                {role === 'malteser' ? 'Malteser Einsatz' : 'Administration'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-strong hover:text-ink md:hidden"
            aria-label="Menü schließen"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="mx-5 h-px bg-hairline" />

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          {visibleSections.map((section, sectionIndex) => (
            <div key={section.label} className={sectionIndex > 0 ? 'mt-5' : ''}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-soft">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => {
                      const hasEmergency = item.icon === 'emergency' && activeEmergencyCount > 0

                      return `group flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 text-[14px] font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.98] ${
                        hasEmergency
                          ? 'border-red-200 bg-red-50 text-red-700 shadow-[0_1px_2px_rgba(220,38,38,0.08),0_5px_18px_rgba(220,38,38,0.10)] hover:bg-red-100'
                          : isActive
                            ? 'border-hairline bg-surface text-ink shadow-[0_1px_2px_rgba(12,10,9,0.04),0_5px_16px_rgba(12,10,9,0.05)]'
                            : 'border-transparent text-body hover:bg-hairline-soft hover:text-ink'
                      }`
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${
                          item.icon === 'emergency' && activeEmergencyCount > 0
                            ? 'bg-red-600 text-white'
                            : isActive
                              ? 'bg-ink-warm text-white'
                              : 'bg-surface-strong text-muted group-hover:text-ink'
                        }`}>
                          <Icon name={item.icon} />
                        </span>
                        <span className="truncate">{item.label}</span>
                        {item.icon === 'emergency' && activeEmergencyCount > 0 ? (
                          <span
                            className="emergency-nav-count ml-auto grid min-w-6 place-items-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-semibold leading-5 text-white"
                            aria-label={`${activeEmergencyCount} offene Notfälle`}
                          >
                            {activeEmergencyCount}
                          </span>
                        ) : isActive ? (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-ink-warm" aria-hidden="true" />
                        ) : null}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-hairline p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:pb-3">
          <div className="rounded-xl border border-hairline bg-surface p-2 shadow-[0_1px_2px_rgba(12,10,9,0.03)]">
            <div className="flex items-center gap-2.5 px-1 py-1">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-strong text-[12px] font-semibold text-ink">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{appUser?.name || 'Rom 2028'}</p>
                <p className="truncate text-[11px] text-muted">{roleLabels[role]}</p>
              </div>
              <button
                type="button"
                onClick={() => signOut(auth)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-hairline-soft hover:text-ink"
                aria-label="Abmelden"
                title="Abmelden"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 17l5-5-5-5M15 12H3M14 3h4a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <div className="sticky top-0 z-10 flex min-h-[57px] items-center gap-3 border-b border-hairline bg-canvas/95 px-4 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full text-body hover:bg-hairline-soft hover:text-ink"
            aria-label="Menü öffnen"
            aria-expanded={mobileMenuOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Rom 2028</p>
            <p className="truncate text-[15px] font-medium leading-tight text-ink">
              {currentItem?.label || (role === 'malteser' ? 'Malteser Einsatz' : 'Administration')}
            </p>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  )
}
