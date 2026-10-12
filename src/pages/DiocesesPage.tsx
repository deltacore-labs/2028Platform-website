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
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-display text-[32px] text-ink" style={{ fontWeight: 300, letterSpacing: '-0.32px' }}>
          Bistümer
        </h2>
        <p className="text-muted text-[13px] mt-0.5 tracking-[0.16px]">
          {dioceses.length} eingetragen
        </p>
      </div>

      {/* Create form */}
      {isAdmin && (
        <div className="bg-surface border border-hairline rounded-xl p-6 mb-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted mb-4">
            Neues Bistum
          </p>

          {createMutation.error && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3 text-[#dc2626] text-[13px]">
              {(createMutation.error as Error).message}
            </div>
          )}

          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Name des Bistums"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 bg-surface text-ink rounded-lg px-4 py-3 border border-hairline-strong text-[15px] focus:outline-none focus:border-ink transition-colors placeholder:text-muted-soft"
            />
            {name.trim() && (
              <span className="text-[13px] text-muted font-mono shrink-0">
                {toSlug(name)}
              </span>
            )}
            <button
              onClick={() => createMutation.mutate()}
              disabled={name.trim().length < 2 || createMutation.isPending}
              className="bg-ink-warm hover:bg-ink disabled:opacity-40 text-white text-[15px] font-medium px-5 py-2.5 rounded-pill transition-colors shrink-0"
            >
              {createMutation.isPending ? 'Anlegen…' : 'Anlegen'}
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-muted text-[15px]">Lade…</p>}

      {/* List */}
      <div className="bg-surface border border-hairline rounded-xl overflow-hidden">
        {dioceses.length === 0 && !isLoading ? (
          <p className="px-5 py-4 text-muted text-[15px]">Noch keine Bistümer angelegt.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {dioceses.map(d => (
              <li key={d.id} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-ink text-[15px] font-medium">{d.name}</span>
                <span className="text-muted text-[13px] font-mono">{d.id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
