import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchGroups, fetchGroupMembers } from '../api/groups'

export function GroupsPage() {
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  })

  const { data: members = [] } = useQuery({
    queryKey: ['group-members', expandedGroupId],
    queryFn: () => fetchGroupMembers(expandedGroupId!),
    enabled: expandedGroupId !== null,
  })

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Gruppen</h2>

      {isLoading && <p className="text-slate-400">Lade…</p>}

      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id} className="bg-slate-800 rounded-xl border border-slate-700">
            <button
              onClick={() => setExpandedGroupId(prev => prev === g.id ? null : g.id)}
              className="w-full text-left p-4 flex items-center justify-between"
            >
              <div>
                <span className="text-white font-medium">{g.name}</span>
                {g.leaderName && (
                  <span className="text-slate-400 text-sm ml-2">· Leiter: {g.leaderName}</span>
                )}
                {g.leaderPhone && (
                  <a
                    href={`tel:${g.leaderPhone}`}
                    onClick={e => e.stopPropagation()}
                    className="text-blue-400 text-sm ml-2 hover:underline"
                  >
                    {g.leaderPhone}
                  </a>
                )}
              </div>
              <span className="text-slate-500 text-sm">
                {expandedGroupId === g.id ? '▲' : '▼'}
              </span>
            </button>

            {expandedGroupId === g.id && (
              <div className="border-t border-slate-700 px-4 py-3">
                {members.length === 0 ? (
                  <p className="text-slate-500 text-sm">Keine Mitglieder</p>
                ) : (
                  <ul className="space-y-1">
                    {members.map(m => (
                      <li key={m.uid} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{m.name}</span>
                        {m.phone && (
                          <a href={`tel:${m.phone}`} className="text-blue-400 hover:underline text-xs">
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
