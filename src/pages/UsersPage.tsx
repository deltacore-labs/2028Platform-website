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
  participant: 'bg-slate-700 text-slate-300',
  leader: 'bg-blue-900 text-blue-300',
  miniteam: 'bg-purple-900 text-purple-300',
}

export function UsersPage() {
  const queryClient = useQueryClient()

  const { data: users = [], isLoading } = useQuery({
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
      <h2 className="text-2xl font-bold text-white mb-6">Nutzerverwaltung</h2>

      {isLoading && <p className="text-slate-400">Lade…</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-left border-b border-slate-800">
              <th className="pb-3 pr-4 font-medium">Name</th>
              <th className="pb-3 pr-4 font-medium">Rolle</th>
              <th className="pb-3 pr-4 font-medium">Gruppe</th>
              <th className="pb-3 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map(u => (
              <tr key={u.uid} className="hover:bg-slate-900/50">
                <td className="py-3 pr-4">
                  <p className="text-white">{u.name}</p>
                  {u.phone && <p className="text-slate-500 text-xs">{u.phone}</p>}
                </td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[u.role]}`}>
                    {roleLabel[u.role]}
                  </span>
                </td>
                <td className="py-3 pr-4 text-slate-400">
                  {groupName(u.groupId)}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <select
                      value={u.role}
                      onChange={e =>
                        roleMutation.mutate({ uid: u.uid, role: e.target.value as UserRole })
                      }
                      className="bg-slate-800 text-slate-300 text-xs rounded px-2 py-1 border border-slate-700 focus:outline-none"
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
                      className="bg-slate-800 text-slate-300 text-xs rounded px-2 py-1 border border-slate-700 focus:outline-none"
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
