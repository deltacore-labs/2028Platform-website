import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchGroups, fetchGroupMembers, fetchJoinRequests, resolveJoinRequest } from '../api/groups'
import { useAuth } from '../context/AuthContext'

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function GroupsPage() {
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const { appUser } = useAuth()
  const queryClient = useQueryClient()
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

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-display text-[32px] text-ink" style={{ fontWeight: 300, letterSpacing: '-0.32px' }}>
          Gruppen
        </h2>
        <p className="text-muted text-[13px] mt-0.5 tracking-[0.16px]">
          {groups.length} Gruppen
        </p>
      </div>

      {isLoading && <p className="text-muted text-[15px]">Lade…</p>}

      <div className="space-y-2">
        {groups.map(g => (
          <div key={g.id} className="bg-surface border border-hairline rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedGroupId(prev => prev === g.id ? null : g.id)}
              className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-canvas-soft transition-colors"
            >
              <div className="flex items-center gap-3">
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
              </div>
              <span className="text-muted-soft text-[13px]">
                {expandedGroupId === g.id ? '▲' : '▼'}
              </span>
            </button>

            {expandedGroupId === g.id && (
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
