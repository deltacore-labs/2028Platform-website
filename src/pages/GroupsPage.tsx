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
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gruppen</h2>

      {isLoading && <p className="text-gray-500">Lade…</p>}

      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id} className="bg-white rounded-xl border border-red-100 shadow-sm">
            <button
              onClick={() => setExpandedGroupId(prev => prev === g.id ? null : g.id)}
              className="w-full text-left p-4 flex items-center justify-between hover:bg-red-50 rounded-xl transition-colors"
            >
              <div>
                <span className="text-gray-900 font-medium">{g.name}</span>
                {g.leaderName && (
                  <span className="text-gray-500 text-sm ml-2">· Leiter: {g.leaderName}</span>
                )}
                {g.leaderPhone && (
                  <a
                    href={`tel:${g.leaderPhone}`}
                    onClick={e => e.stopPropagation()}
                    className="text-red-600 text-sm ml-2 hover:underline"
                  >
                    {g.leaderPhone}
                  </a>
                )}
              </div>
              <span className="text-gray-400 text-sm">
                {expandedGroupId === g.id ? '▲' : '▼'}
              </span>
            </button>

            {expandedGroupId === g.id && (
              <div className="border-t border-red-100 px-4 py-3 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Mitglieder</p>
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

                {isPrivileged && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Beitrittsanfragen
                      {joinRequests.length > 0 && (
                        <span className="ml-1.5 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">
                          {joinRequests.length}
                        </span>
                      )}
                    </p>
                    {joinRequests.length === 0 ? (
                      <p className="text-gray-400 text-sm">Keine offenen Anfragen</p>
                    ) : (
                      <ul className="space-y-2">
                        {joinRequests.map(req => (
                          <li
                            key={req.id}
                            className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2"
                          >
                            <div>
                              <span className="text-gray-800 text-sm font-medium">{req.requester_name}</span>
                              <span className="text-gray-400 text-xs ml-2">{formatDate(req.created_at)}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => resolveMutation.mutate({ requestId: req.id, action: 'approve' })}
                                disabled={resolveMutation.isPending}
                                className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                Annehmen
                              </button>
                              <button
                                onClick={() => resolveMutation.mutate({ requestId: req.id, action: 'reject' })}
                                disabled={resolveMutation.isPending}
                                className="text-xs bg-white border border-gray-300 text-gray-600 px-2.5 py-1 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
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
