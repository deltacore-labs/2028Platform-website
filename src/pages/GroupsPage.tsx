import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchGroups, fetchGroupMembers, createGroup, updateGroup, deleteGroup } from '../api/groups'

export function GroupsPage() {
  const queryClient = useQueryClient()
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => createGroup(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setNewName('')
    },
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateGroup(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })

  const { data: members = [] } = useQuery({
    queryKey: ['group-members', expandedGroupId],
    queryFn: () => fetchGroupMembers(expandedGroupId!),
    enabled: expandedGroupId !== null,
  })

  const startEdit = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
  }

  const confirmDelete = (id: string, name: string) => {
    if (window.confirm(`Gruppe "${name}" wirklich löschen? Alle Mitglieder werden aus der Gruppe entfernt.`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gruppen</h2>

      <div className="bg-white border border-red-100 rounded-xl p-5 mb-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Neue Gruppe anlegen</h3>

        {createMutation.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-xs font-mono">
            {(createMutation.error as Error).message}
          </div>
        )}

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Gruppenname"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && newName.trim().length >= 2 && createMutation.mutate(newName.trim())}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
          />
          <button
            onClick={() => createMutation.mutate(newName.trim())}
            disabled={newName.trim().length < 2 || createMutation.isPending}
            className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-50 hover:bg-red-700 transition-colors"
          >
            {createMutation.isPending ? 'Anlegen…' : 'Anlegen'}
          </button>
        </div>
      </div>

      {isLoading && <p className="text-gray-500">Lade…</p>}

      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id} className="bg-white rounded-xl border border-red-100 shadow-sm">
            <div className="p-4 flex items-center gap-2">
              {editingId === g.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && editName.trim().length >= 2) renameMutation.mutate({ id: g.id, name: editName.trim() })
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                  <button
                    onClick={() => renameMutation.mutate({ id: g.id, name: editName.trim() })}
                    disabled={editName.trim().length < 2 || renameMutation.isPending}
                    className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 hover:bg-red-700 transition-colors"
                  >
                    {renameMutation.isPending ? '…' : 'Speichern'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-gray-400 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setExpandedGroupId(prev => prev === g.id ? null : g.id)}
                    className="flex-1 text-left flex items-center gap-2 min-w-0"
                  >
                    <span className="text-gray-900 font-medium truncate">{g.name}</span>
                    {g.leaderName && (
                      <span className="text-gray-500 text-sm shrink-0">· Leiter: {g.leaderName}</span>
                    )}
                    {g.leaderPhone && (
                      <a
                        href={`tel:${g.leaderPhone}`}
                        onClick={e => e.stopPropagation()}
                        className="text-red-600 text-sm shrink-0 hover:underline"
                      >
                        {g.leaderPhone}
                      </a>
                    )}
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(g.id, g.name)}
                      className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                      title="Umbenennen"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => confirmDelete(g.id, g.name)}
                      disabled={deleteMutation.isPending}
                      className="text-gray-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors text-xs disabled:opacity-50"
                      title="Löschen"
                    >
                      🗑️
                    </button>
                    <span
                      onClick={() => setExpandedGroupId(prev => prev === g.id ? null : g.id)}
                      className="text-gray-400 text-sm px-2 cursor-pointer"
                    >
                      {expandedGroupId === g.id ? '▲' : '▼'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {expandedGroupId === g.id && (
              <div className="border-t border-red-100 px-4 py-3">
                {members.length === 0 ? (
                  <p className="text-gray-400 text-sm">Keine Mitglieder</p>
                ) : (
                  <ul className="space-y-1">
                    {members.map(m => (
                      <li key={m.uid} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{m.name}</span>
                        {m.phone && (
                          <a href={`tel:${m.phone}`} className="text-red-600 hover:underline text-xs">
                            {m.phone}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
