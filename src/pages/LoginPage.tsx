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
    <div className="min-h-screen bg-red-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl border border-red-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
            ✞
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Rom 2028 Admin</h1>
            <p className="text-gray-500 text-xs mt-0.5">Nur für Miniteam & Leiter</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-white text-gray-900 rounded-lg px-4 py-2.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-white text-gray-900 rounded-lg px-4 py-2.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  )
}
