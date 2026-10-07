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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gruppen</h2>

      {isLoading && <p className="text-gray-500">Lade…</p>}

      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <button
              onClick={() => setExpandedGroupId(prev => prev === g.id ? null : g.id)}
              className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 rounded-xl transition-colors"
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
              <div className="border-t border-gray-200 px-4 py-3">
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
