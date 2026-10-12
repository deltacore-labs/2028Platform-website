import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDioceses, createDiocese, updateDiocese, deleteDiocese } from '../api/dioceses'
import { fetchAllUsers } from '../api/users'
import { useAuth } from '../context/AuthContext'

function toSlug(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function DiocesesPage() {
  const queryClient = useQueryClient()
  const { appUser } = useAuth()
  const isAdmin = appUser?.role === 'admin'

  const [newName, setNewName] = useState('')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { data: dioceses = [], isLoading } = useQuery({
    queryKey: ['dioceses'],
    queryFn: fetchDioceses,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchAllUsers,
    enabled: isAdmin,
  })

  const userCountByDiocese = users.reduce<Record<string, number>>((acc, u) => {
    if (u.dioceseId) acc[u.dioceseId] = (acc[u.dioceseId] ?? 0) + 1
    return acc
  }, {})

  const createMutation = useMutation({
    mutationFn: () => createDiocese(toSlug(newName), newName.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dioceses'] })
      setNewName('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateDiocese(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dioceses'] })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDiocese(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dioceses'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmDeleteId(null)
    },
  })

  const filtered = dioceses.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase())
  )

  function startEdit(d: { id: string; name: string }) {
    setEditingId(d.id)
    setEditName(d.name)
    setConfirmDeleteId(null)
  }

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
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && newName.trim().length >= 2 && createMutation.mutate()}
              className="flex-1 bg-surface text-ink rounded-lg px-4 py-3 border border-hairline-strong text-[15px] focus:outline-none focus:border-ink transition-colors placeholder:text-muted-soft"
            />
            {newName.trim() && (
              <span className="text-[13px] text-muted font-mono shrink-0">
                {toSlug(newName)}
              </span>
            )}
            <button
              onClick={() => createMutation.mutate()}
              disabled={newName.trim().length < 2 || createMutation.isPending}
              className="bg-ink-warm hover:bg-ink disabled:opacity-40 text-white text-[15px] font-medium px-5 py-2.5 rounded-pill transition-colors shrink-0"
            >
              {createMutation.isPending ? 'Anlegen…' : 'Anlegen'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {dioceses.length > 3 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Suchen…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface text-ink rounded-lg px-4 py-2.5 border border-hairline-strong text-[14px] focus:outline-none focus:border-ink transition-colors placeholder:text-muted-soft"
          />
        </div>
      )}

      {isLoading && <p className="text-muted text-[15px]">Lade…</p>}

      {/* List */}
      <div className="bg-surface border border-hairline rounded-xl overflow-hidden">
        {filtered.length === 0 && !isLoading ? (
          <p className="px-5 py-4 text-muted text-[15px]">
            {search ? 'Keine Treffer.' : 'Noch keine Bistümer angelegt.'}
          </p>
        ) : (
          <ul className="divide-y divide-hairline">
            {filtered.map(d => (
              <li key={d.id} className="px-5 py-3.5">
                {editingId === d.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && editName.trim().length >= 2)
                          updateMutation.mutate({ id: d.id, name: editName.trim() })
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                      className="flex-1 bg-canvas text-ink rounded-lg px-3 py-2 border border-hairline-strong text-[15px] focus:outline-none focus:border-ink transition-colors"
                    />
                    <button
                      onClick={() => updateMutation.mutate({ id: d.id, name: editName.trim() })}
                      disabled={editName.trim().length < 2 || updateMutation.isPending}
                      className="text-[13px] bg-ink-warm hover:bg-ink disabled:opacity-40 text-white px-3 py-1.5 rounded-pill transition-colors font-medium"
                    >
                      {updateMutation.isPending ? '…' : 'Speichern'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-[13px] text-muted hover:text-ink transition-colors px-2 py-1.5"
                    >
                      Abbrechen
                    </button>
                  </div>
                ) : confirmDeleteId === d.id ? (
                  <div className="flex items-center gap-3">
                    <p className="text-ink text-[14px] flex-1">
                      <span className="font-medium">{d.name}</span> wirklich löschen? Alle zugehörigen Nutzer verlieren die Bistumszuordnung.
                    </p>
                    <button
                      onClick={() => deleteMutation.mutate(d.id)}
                      disabled={deleteMutation.isPending}
                      className="text-[13px] bg-red-50 hover:bg-red-100 disabled:opacity-50 text-[#dc2626] border border-red-200 px-3 py-1.5 rounded-pill transition-colors font-medium shrink-0"
                    >
                      {deleteMutation.isPending ? '…' : 'Löschen'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-[13px] text-muted hover:text-ink transition-colors px-2 py-1.5 shrink-0"
                    >
                      Abbrechen
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-ink text-[15px] font-medium truncate">{d.name}</span>
                      <span className="text-muted text-[13px] font-mono shrink-0">{d.id}</span>
                      {isAdmin && userCountByDiocese[d.id] !== undefined && (
                        <span className="text-[12px] text-muted bg-canvas px-2 py-0.5 rounded-pill shrink-0">
                          {userCountByDiocese[d.id]} {userCountByDiocese[d.id] === 1 ? 'Nutzer' : 'Nutzer'}
                        </span>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => startEdit(d)}
                          className="text-[13px] text-muted hover:text-ink transition-colors px-2.5 py-1 rounded-lg hover:bg-canvas"
                        >
                          Umbenennen
                        </button>
                        <button
                          onClick={() => { setConfirmDeleteId(d.id); setEditingId(null) }}
                          className="text-[13px] text-muted hover:text-[#dc2626] transition-colors px-2.5 py-1 rounded-lg hover:bg-red-50"
                        >
                          Löschen
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
