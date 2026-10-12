import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAllUsers, updateUserRole, updateUserGroup, createUser } from '../api/users'
import { fetchGroups } from '../api/groups'
import type { UserRole } from '../types'

const roleLabel: Record<UserRole, string> = {
  participant: 'Teilnehmer',
  leader: 'Leiter',
  miniteam: 'Miniteam',
  admin: 'Admin',
}

const roleBadge: Record<UserRole, string> = {
  participant: 'bg-surface-strong text-ink-warm',
  leader: 'bg-[#f0faf4] text-[#16a34a]',
  miniteam: 'bg-[#f5f0fa] text-[#7c3aed]',
  admin: 'bg-canvas-deep text-white',
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('leader')
  const [createResult, setCreateResult] = useState<{ name: string; tempPassword: string } | null>(null)

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

  const createMutation = useMutation({
    mutationFn: ({ name, email, role }: { name: string; email: string; role: UserRole }) => createUser(name, email, role),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setCreateResult({ name: newName, tempPassword: data.temp_password })
      setNewName('')
      setNewEmail('')
      setNewRole('leader')
    },
  })

  const groupName = (id: string | null) => groups.find(g => g.id === id)?.name ?? '—'

  const inputClass = "bg-surface text-ink rounded-lg px-3 py-2.5 border border-hairline-strong text-[14px] focus:outline-none focus:border-ink transition-colors placeholder:text-muted-soft"

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-display text-[32px] text-ink" style={{ fontWeight: 300, letterSpacing: '-0.32px' }}>
          Nutzerverwaltung
        </h2>
        <p className="text-muted text-[13px] mt-0.5 tracking-[0.16px]">
          {users.length} Nutzer
        </p>
      </div>

      {/* Create user card */}
      <div className="bg-surface border border-hairline rounded-xl p-6 mb-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted mb-1">
          Neues Konto
        </p>
        <p className="text-muted text-[13px] mb-4">
          Das Konto erhält ein temporäres Passwort, das beim ersten Login geändert werden muss.
        </p>

        {createResult && (
          <div className="bg-[#f0faf4] border border-[#bbf7d0] rounded-xl p-4 mb-4">
            <p className="font-medium text-[#16a34a] text-[14px] mb-1">
              Konto für {createResult.name} erstellt
            </p>
            <p className="text-[#16a34a] text-[13px]">
              Temporäres Passwort:{' '}
              <span className="font-mono font-bold">{createResult.tempPassword}</span>
            </p>
            <button
              onClick={() => setCreateResult(null)}
              className="mt-2 text-[13px] text-[#16a34a] hover:underline underline-offset-2"
            >
              Schließen
            </button>
          </div>
        )}

        {createMutation.error && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4 text-[#dc2626] text-[13px] font-mono">
            {(createMutation.error as Error).message}
          </div>
        )}

        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[12px] font-medium text-muted mb-1.5 tracking-[0.4px] uppercase">Name</label>
            <input
              type="text"
              placeholder="Vor- und Nachname"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className={`w-full ${inputClass}`}
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[12px] font-medium text-muted mb-1.5 tracking-[0.4px] uppercase">E-Mail</label>
            <input
              type="email"
              placeholder="name@bistum.de"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className={`w-full ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-muted mb-1.5 tracking-[0.4px] uppercase">Rolle</label>
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value as UserRole)}
              className={`bg-surface ${inputClass}`}
            >
              <option value="leader">Leiter</option>
              <option value="participant">Teilnehmer</option>
              <option value="miniteam">Miniteam</option>
            </select>
          </div>
          <button
            onClick={() => createMutation.mutate({ name: newName.trim(), email: newEmail.trim(), role: newRole })}
            disabled={newName.trim().length < 2 || !newEmail.includes('@') || createMutation.isPending}
            className="bg-ink-warm hover:bg-ink disabled:opacity-40 text-white text-[15px] font-medium px-5 py-2.5 rounded-pill transition-colors"
          >
            {createMutation.isPending ? 'Anlegen…' : 'Anlegen'}
          </button>
        </div>
      </div>

      {isLoading && <p className="text-muted text-[15px]">Lade…</p>}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 text-[#dc2626] text-[13px] font-mono">
          Fehler: {(error as Error).message}
        </div>
      )}

      {/* Table */}
      <div className="bg-surface border border-hairline rounded-xl overflow-hidden">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-hairline">
              <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-[0.8px] uppercase text-muted">Name</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-[0.8px] uppercase text-muted">Rolle</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-[0.8px] uppercase text-muted">Gruppe</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-[0.8px] uppercase text-muted">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {users.map(u => (
              <tr key={u.uid} className="hover:bg-canvas-soft transition-colors">
                <td className="px-5 py-3.5">
                  <p className="text-ink font-medium">{u.name}</p>
                  {u.phone && <p className="text-muted text-[12px] mt-0.5">{u.phone}</p>}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-0.5 rounded-pill text-[11px] font-semibold tracking-[0.6px] uppercase ${roleBadge[u.role]}`}>
                    {roleLabel[u.role]}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-body">
                  {groupName(u.groupId)}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-2">
                    <select
                      value={u.role}
                      onChange={e => roleMutation.mutate({ uid: u.uid, role: e.target.value as UserRole })}
                      className="bg-surface text-body text-[13px] rounded-lg px-2.5 py-1.5 border border-hairline-strong focus:outline-none focus:border-ink transition-colors"
                    >
                      <option value="participant">Teilnehmer</option>
                      <option value="leader">Leiter</option>
                      <option value="miniteam">Miniteam</option>
                    </select>
                    <select
                      value={u.groupId ?? ''}
                      onChange={e => groupMutation.mutate({ uid: u.uid, groupId: e.target.value || null })}
                      className="bg-surface text-body text-[13px] rounded-lg px-2.5 py-1.5 border border-hairline-strong focus:outline-none focus:border-ink transition-colors"
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
