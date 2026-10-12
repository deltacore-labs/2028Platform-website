import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/firebase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin')
    } catch {
      setError('Login fehlgeschlagen. Bitte E-Mail und Passwort prüfen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      {/* Atmospheric gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, #a7e5d3 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #c8b8e0 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, #f4c5a8 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-ink-warm text-white mb-4">
            <span className="text-base">✞</span>
          </div>
          <h1 className="font-display text-[32px] leading-tight text-ink" style={{ fontWeight: 300, letterSpacing: '-0.32px' }}>
            Rom 2028
          </h1>
          <p className="text-muted text-[13px] mt-1 tracking-[0.6px] uppercase font-medium">
            Teambereich
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-hairline rounded-2xl p-8 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-body mb-1.5 tracking-[0.16px]">
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-surface text-ink rounded-lg px-4 py-3 border border-hairline-strong text-[15px] focus:outline-none focus:border-ink focus:ring-0 transition-colors placeholder:text-muted-soft"
                placeholder="name@bistum.de"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-body mb-1.5 tracking-[0.16px]">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-surface text-ink rounded-lg px-4 py-3 border border-hairline-strong text-[15px] focus:outline-none focus:border-ink focus:ring-0 transition-colors placeholder:text-muted-soft"
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
              {loading ? 'Anmelden…' : 'Anmelden'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
