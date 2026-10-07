import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAllUsers, updateUserRole, updateUserGroup } from '../api/users'
import { fetchGroups } from '../api/groups'
import type { UserRole } from '../types'

const roleLabel: Record<UserRole, string> = {
  participant: 'Teilnehmer',
  leader: 'Leiter',
  miniteam: 'Miniteam',
}

const roleBadge: Record<UserRole, string> = {
  participant: 'bg-red-50 text-red-600',
  leader: 'bg-green-100 text-green-700',
  miniteam: 'bg-red-100 text-red-700',
}

export function UsersPage() {
  const queryClient = useQueryClient()

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchAllUsers,
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  })

  const roleMutation = useMutation({
    mutationFn: ({ uid, role }: { uid: string; role: UserRole }) => updateUserRole(uid, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const groupMutation = useMutation({
    mutationFn: ({ uid, groupId }: { uid: string; groupId: string | null }) =>
      updateUserGroup(uid, groupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const groupName = (id: string | null) => groups.find(g => g.id === id)?.name ?? '—'

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Nutzerverwaltung</h2>

      {isLoading && <p className="text-gray-500">Lade…</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700 text-sm font-mono">
          Fehler: {(error as Error).message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-left border-b border-red-100">
              <th className="pb-3 pr-4 font-medium">Name</th>
              <th className="pb-3 pr-4 font-medium">Rolle</th>
              <th className="pb-3 pr-4 font-medium">Gruppe</th>
              <th className="pb-3 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.uid} className="hover:bg-red-50">
                <td className="py-3 pr-4">
                  <p className="text-gray-900">{u.name}</p>
                  {u.phone && <p className="text-gray-400 text-xs">{u.phone}</p>}
                </td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[u.role]}`}>
                    {roleLabel[u.role]}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-500">
                  {groupName(u.groupId)}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <select
                      value={u.role}
                      onChange={e =>
                        roleMutation.mutate({ uid: u.uid, role: e.target.value as UserRole })
                      }
                      className="bg-white text-gray-700 text-xs rounded px-2 py-1 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-red-600"
                    >
                      <option value="participant">Teilnehmer</option>
                      <option value="leader">Leiter</option>
                      <option value="miniteam">Miniteam</option>
                    </select>
                    <select
                      value={u.groupId ?? ''}
                      onChange={e =>
                        groupMutation.mutate({ uid: u.uid, groupId: e.target.value || null })
                      }
                      className="bg-white text-gray-700 text-xs rounded px-2 py-1 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-red-600"
                    >
                      <option value="">Keine Gruppe</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
