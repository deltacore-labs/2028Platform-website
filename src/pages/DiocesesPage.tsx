import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDioceses, createDiocese } from '../api/dioceses'
import { useAuth } from '../context/AuthContext'

function toSlug(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function DiocesesPage() {
  const queryClient = useQueryClient()
  const { appUser } = useAuth()
  const isAdmin = appUser?.role === 'admin'
  const [name, setName] = useState('')

  const { data: dioceses = [], isLoading } = useQuery({
    queryKey: ['dioceses'],
    queryFn: fetchDioceses,
  })

  const createMutation = useMutation({
    mutationFn: () => createDiocese(toSlug(name), name.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dioceses'] })
      setName('')
    },
  })

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Bistümer</h2>

      {isAdmin && (
        <div className="bg-white border border-red-100 rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Neues Bistum anlegen
          </h3>

          {createMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-red-700 text-xs font-mono">
              {(createMutation.error as Error).message}
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Name des Bistums"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
            />
            {name.trim() && (
              <span className="self-center text-xs text-gray-400 font-mono">
                ID: {toSlug(name)}
              </span>
            )}
            <button
              onClick={() => createMutation.mutate()}
              disabled={name.trim().length < 2 || createMutation.isPending}
              className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-50 hover:bg-red-700 transition-colors"
            >
              {createMutation.isPending ? 'Anlegen…' : 'Anlegen'}
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-gray-500">Lade…</p>}

      <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
        {dioceses.length === 0 && !isLoading ? (
          <p className="p-4 text-gray-400 text-sm">Noch keine Bistümer angelegt.</p>
        ) : (
          <ul className="divide-y divide-red-50">
            {dioceses.map(d => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-gray-900 font-medium">{d.name}</span>
                <span className="text-gray-400 text-xs font-mono">{d.id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
