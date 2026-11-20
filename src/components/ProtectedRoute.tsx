import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ForcePasswordChange } from './ForcePasswordChange'
import type { UserRole } from '../types'

interface Props {
  children: React.ReactNode
  requiredRole?: UserRole | 'emergency'
}

export function ProtectedRoute({ children, requiredRole }: Props) {
  const { firebaseUser, appUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400">Laden…</div>
      </div>
    )
  }

  if (!firebaseUser) return <Navigate to="/login" replace />

  if (appUser?.mustChangePassword) return <ForcePasswordChange />

  const redirectDeniedMalteser = appUser?.role === 'malteser'
    ? <Navigate to="/admin/emergency" replace />
    : null

  if (requiredRole === 'admin' && appUser?.role !== 'admin') {
    if (redirectDeniedMalteser) return redirectDeniedMalteser
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="font-semibold text-lg">Zugriff verweigert</p>
          <p className="text-sm mt-1 text-red-500">Diese Seite ist nur für Administratoren.</p>
        </div>
      </div>
    )
  }

  if (requiredRole === 'miniteam' && appUser?.role !== 'miniteam' && appUser?.role !== 'admin') {
    if (redirectDeniedMalteser) return redirectDeniedMalteser
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="font-semibold text-lg">Zugriff verweigert</p>
          <p className="text-sm mt-1 text-red-500">Diese Seite ist nur für das Miniteam.</p>
        </div>
      </div>
    )
  }

  if (
    requiredRole === 'leader' &&
    appUser?.role !== 'leader' &&
    appUser?.role !== 'miniteam' &&
    appUser?.role !== 'admin'
  ) {
    if (redirectDeniedMalteser) return redirectDeniedMalteser
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="font-semibold text-lg">Zugriff verweigert</p>
          <p className="text-sm mt-1 text-red-500">Diese Seite ist nur für Leitende und Miniteam.</p>
        </div>
      </div>
    )
  }

  if (
    requiredRole === 'emergency' &&
    appUser?.role !== 'malteser' &&
    appUser?.role !== 'miniteam' &&
    appUser?.role !== 'admin'
  ) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="font-semibold text-lg">Zugriff verweigert</p>
          <p className="text-sm mt-1 text-red-500">Diese Seite ist nur für das Einsatzteam.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
