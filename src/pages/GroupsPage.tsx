import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchGroups,
  fetchGroupMembers,
  fetchJoinRequests,
  resolveJoinRequest,
  createGroup,
  updateGroup,
  deleteGroup,
} from '../api/groups'
import { useAuth } from '../context/AuthContext'

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function GroupsPage() {
  const queryClient = useQueryClient()
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { appUser } = useAuth()
  const isPrivileged = appUser?.role === 'miniteam' || appUser?.role === 'admin'

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  })

  const { data: members = [] } = useQuery({
    queryKey: ['group-members', expandedGroupId],
    queryFn: () => fetchGroupMembers(expandedGroupId!),
    enabled: expandedGroupId !== null,
  })

  const { data: joinRequests = [] } = useQuery({
    queryKey: ['join-requests', expandedGroupId],
    queryFn: () => fetchJoinRequests(expandedGroupId!),
    enabled: expandedGroupId !== null && isPrivileged,
  })

  const resolveMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'approve' | 'reject' }) =>
      resolveJoinRequest(expandedGroupId!, requestId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', expandedGroupId] })
      queryClient.invalidateQueries({ queryKey: ['group-members', expandedGroupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: () => createGroup(newGroupName.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setNewGroupName('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateGroup(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmDeleteId(null)
      if (expandedGroupId === id) setExpandedGroupId(null)
    },
  })

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.leaderName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function startEdit(g: { id: string; name: string }) {
    setEditingId(g.id)
    setEditName(g.name)
    setConfirmDeleteId(null)
    setExpandedGroupId(null)
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-display text-[32px] text-ink" style={{ fontWeight: 300, letterSpacing: '-0.32px' }}>
          Gruppen
        </h2>
        <p className="text-muted text-[13px] mt-0.5 tracking-[0.16px]">
          {search ? `${filtered.length} von ${groups.length} Gruppen` : `${groups.length} Gruppen`}
        </p>
      </div>

      {/* Create group */}
      {isPrivileged && (
        <div className="bg-surface border border-hairline rounded-xl p-6 mb-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted mb-4">
            Neue Gruppe
          </p>
          {createMutation.error && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3 text-[#dc2626] text-[13px]">
              {(createMutation.error as Error).message}
            </div>
          )}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Gruppenname"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && newGroupName.trim().length >= 2 && createMutation.mutate()}
              className="flex-1 bg-surface text-ink rounded-lg px-4 py-3 border border-hairline-strong text-[15px] focus:outline-none focus:border-ink transition-colors placeholder:text-muted-soft"
            />
            <button
              onClick={() => createMutation.mutate()}
              disabled={newGroupName.trim().length < 2 || createMutation.isPending}
              className="bg-ink-warm hover:bg-ink disabled:opacity-40 text-white text-[15px] font-medium px-5 py-2.5 rounded-pill transition-colors shrink-0"
            >
              {createMutation.isPending ? 'Anlegen…' : 'Anlegen'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {groups.length > 3 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Gruppe oder Leiter suchen…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface text-ink rounded-lg px-4 py-2.5 border border-hairline-strong text-[14px] focus:outline-none focus:border-ink transition-colors placeholder:text-muted-soft"
          />
        </div>
      )}

      {isLoading && <p className="text-muted text-[15px]">Lade…</p>}

      <div className="space-y-2">
        {filtered.length === 0 && !isLoading && (
          <p className="text-muted text-[15px]">{search ? 'Keine Treffer.' : 'Keine Gruppen vorhanden.'}</p>
        )}
        {filtered.map(g => (
          <div key={g.id} className="bg-surface border border-hairline rounded-xl overflow-hidden">
            {/* Row header: edit / delete mode vs normal */}
            {editingId === g.id ? (
              <div className="px-5 py-4 flex gap-2 items-center">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && editName.trim().length >= 2)
                      updateMutation.mutate({ id: g.id, name: editName.trim() })
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  autoFocus
                  className="flex-1 bg-canvas text-ink rounded-lg px-3 py-2 border border-hairline-strong text-[15px] focus:outline-none focus:border-ink transition-colors"
                />
                <button
                  onClick={() => updateMutation.mutate({ id: g.id, name: editName.trim() })}
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
            ) : confirmDeleteId === g.id ? (
              <div className="px-5 py-4 flex items-center gap-3">
                <p className="text-ink text-[14px] flex-1">
                  <span className="font-medium">{g.name}</span> löschen? Alle Mitglieder verlieren die Gruppenzuordnung.
                </p>
                <button
                  onClick={() => deleteMutation.mutate(g.id)}
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
              <div className="flex items-center">
                <button
                  onClick={() => setExpandedGroupId(prev => prev === g.id ? null : g.id)}
                  className="flex-1 text-left px-5 py-4 flex items-center justify-between hover:bg-canvas-soft transition-colors"
                >
                  <div>
                    <span className="text-ink font-medium text-[15px]">{g.name}</span>
                    {g.leaderName && (
                      <span className="text-muted text-[14px] ml-2">· {g.leaderName}</span>
                    )}
                    {g.leaderPhone && (
                      <a
                        href={`tel:${g.leaderPhone}`}
                        onClick={e => e.stopPropagation()}
                        className="text-ink-warm text-[14px] ml-2 hover:underline underline-offset-2"
                      >
                        {g.leaderPhone}
                      </a>
                    )}
                  </div>
                  <span className="text-muted-soft text-[13px] mr-3">
                    {expandedGroupId === g.id ? '▲' : '▼'}
                  </span>
                </button>
                {isPrivileged && (
                  <div className="flex gap-1 pr-4 shrink-0">
                    <button
                      onClick={() => startEdit(g)}
                      className="text-[13px] text-muted hover:text-ink transition-colors px-2.5 py-1.5 rounded-lg hover:bg-canvas"
                    >
                      Umbenennen
                    </button>
                    <button
                      onClick={() => { setConfirmDeleteId(g.id); setEditingId(null) }}
                      className="text-[13px] text-muted hover:text-[#dc2626] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50"
                    >
                      Löschen
                    </button>
                  </div>
                )}
              </div>
            )}

            {expandedGroupId === g.id && editingId !== g.id && confirmDeleteId !== g.id && (
              <div className="border-t border-hairline px-5 py-4 space-y-5">
                {/* Members */}
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted mb-3">
                    Mitglieder
                  </p>
                  {members.length === 0 ? (
                    <p className="text-muted text-[14px]">Keine Mitglieder</p>
                  ) : (
                    <ul className="space-y-2">
                      {members.map(m => (
                        <li key={m.uid} className="flex items-center justify-between">
                          <span className="text-body text-[15px]">{m.name}</span>
                          {m.phone && (
                            <a
                              href={`tel:${m.phone}`}
                              className="text-ink-warm text-[13px] hover:underline underline-offset-2"
                            >
                              {m.phone}
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Join requests */}
                {isPrivileged && (
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted mb-3 flex items-center gap-2">
                      Beitrittsanfragen
                      {joinRequests.length > 0 && (
                        <span className="bg-ink-warm text-white text-[11px] font-bold rounded-full px-2 py-0.5">
                          {joinRequests.length}
                        </span>
                      )}
                    </p>
                    {joinRequests.length === 0 ? (
                      <p className="text-muted text-[14px]">Keine offenen Anfragen</p>
                    ) : (
                      <ul className="space-y-2">
                        {joinRequests.map(req => (
                          <li
                            key={req.id}
                            className="flex items-center justify-between bg-canvas rounded-lg px-4 py-3"
                          >
                            <div>
                              <span className="text-ink text-[15px] font-medium">{req.requester_name}</span>
                              <span className="text-muted text-[13px] ml-2">{formatDate(req.created_at)}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => resolveMutation.mutate({ requestId: req.id, action: 'approve' })}
                                disabled={resolveMutation.isPending}
                                className="text-[13px] bg-[#f0faf4] hover:bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0] px-3 py-1.5 rounded-pill disabled:opacity-50 transition-colors font-medium"
                              >
                                Annehmen
                              </button>
                              <button
                                onClick={() => resolveMutation.mutate({ requestId: req.id, action: 'reject' })}
                                disabled={resolveMutation.isPending}
                                className="text-[13px] bg-surface border border-hairline-strong text-body px-3 py-1.5 rounded-pill hover:bg-canvas disabled:opacity-50 transition-colors font-medium"
                              >
                                Ablehnen
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
