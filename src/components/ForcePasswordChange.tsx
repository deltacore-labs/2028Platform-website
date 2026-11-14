import { useState } from 'react'
import { getIdToken, updatePassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { apiClient } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { synchronizeOwnMatrixPassword } from '../api/users'

export function ForcePasswordChange() {
  const { refreshUser } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const inputClass =
    'w-full bg-surface text-ink rounded-lg px-4 py-3 border border-hairline-strong text-[15px] focus:outline-none focus:border-ink transition-colors placeholder:text-muted-soft'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirm) {
      setError('Passwörter stimmen nicht überein.')
      return
    }
    if (newPassword.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }
    setLoading(true)
    setError(null)
    let firebasePasswordChanged = false
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Nicht angemeldet')
      await updatePassword(user, newPassword)
      firebasePasswordChanged = true
      // Force a fresh ID token after Firebase changed the credential. The
      // worker uses the recent auth time and verifies the Firebase password
      // timestamp before it clears the mandatory-change flag.
      await getIdToken(user, true)
      await apiClient.post('/v1/users/me/password-changed')
      // Admin and Miniteam accounts use the same credential for Matrix. For
      // all other roles the endpoint is an intentional no-op.
      await synchronizeOwnMatrixPassword(newPassword)
      await refreshUser()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Fehler beim Ändern des Passworts'
      setError(firebasePasswordChanged
        ? `Das App-Passwort wurde geändert, aber die Kontosynchronisierung ist fehlgeschlagen. Bitte klicke erneut auf „Passwort speichern“. (${msg})`
        : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, #a7e5d3 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #c8b8e0 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-ink-warm text-white mb-4">
            <span className="text-base">✞</span>
          </div>
          <h1
            className="font-display text-[32px] leading-tight text-ink"
            style={{ fontWeight: 300, letterSpacing: '-0.32px' }}
          >
            Passwort ändern
          </h1>
          <p className="text-muted text-[13px] mt-1">
            Bitte setze jetzt ein persönliches Passwort.
          </p>
        </div>

        <div className="bg-surface border border-hairline rounded-2xl p-8 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-body mb-1.5 tracking-[0.16px]">
                Neues Passwort
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
                className={inputClass}
                placeholder="Mindestens 8 Zeichen"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-body mb-1.5 tracking-[0.16px]">
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-[#dc2626] text-[13px] bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink-warm hover:bg-ink disabled:opacity-50 text-white font-medium py-2.5 rounded-pill text-[15px] transition-colors mt-2"
            >
              {loading ? 'Speichern…' : 'Passwort speichern'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
