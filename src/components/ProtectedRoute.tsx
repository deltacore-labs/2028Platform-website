import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

interface Props {
  children: React.ReactNode
  requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole }: Props) {
  const { firebaseUser, appUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Laden…</div>
      </div>
    )
  }

  if (!firebaseUser) return <Navigate to="/login" replace />

  if (requiredRole === 'miniteam' && appUser?.role !== 'miniteam') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-red-400 bg-red-950 rounded-xl p-6 text-center">
          <p className="font-semibold text-lg">Zugriff verweigert</p>
          <p className="text-sm mt-1 text-red-300">Diese Seite ist nur für das Miniteam.</p>
        </div>
      </div>
    )
  }

  if (requiredRole === 'leader' && appUser?.role === 'participant') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-red-400 bg-red-950 rounded-xl p-6 text-center">
          <p className="font-semibold text-lg">Zugriff verweigert</p>
          <p className="text-sm mt-1 text-red-300">Diese Seite ist nur für Leiter und Miniteam.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
