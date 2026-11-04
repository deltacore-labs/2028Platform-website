import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAllUsers, updateUserAssignment } from '../api/users'
import { fetchGroups, updateGroup } from '../api/groups'
import { fetchDioceses } from '../api/dioceses'
import { fetchEmergencyReports } from '../api/emergency'
import { useAuth } from '../context/AuthContext'
import { OrganizationTree, type OrganizationMove } from '../components/OrganizationTree'
import type { AppUser, Group } from '../types'

export function OverviewPage() {
  const queryClient = useQueryClient()
  const { appUser } = useAuth()
  const [moveMessage, setMoveMessage] = useState<string | null>(null)
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: fetchAllUsers,
    refetchInterval: 30_000,
  })
  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    refetchInterval: 30_000,
  })
  const { data: dioceses = [] } = useQuery({
    queryKey: ['dioceses'],
    queryFn: fetchDioceses,
    refetchInterval: 30_000,
  })
  const { data: reports = [] } = useQuery({
    queryKey: ['emergency'],
    queryFn: fetchEmergencyReports,
    refetchInterval: 15_000,
  })

  const userByUid = useMemo(() => new Map(users.map(u => [u.uid, u])), [users])

  const usersByDiocese = useMemo(() => {
    const m = new Map<string | null, number>()
    for (const u of users) m.set(u.dioceseId, (m.get(u.dioceseId) ?? 0) + 1)
    return m
  }, [users])

  const usersByGroup = useMemo(() => {
    const m = new Map<string | null, number>()
    for (const u of users) m.set(u.groupId, (m.get(u.groupId) ?? 0) + 1)
    return m
  }, [users])

  const totalUsers = users.length
  const totalGroups = groups.length
  const totalDioceses = dioceses.length
  const activeEmergencies = reports.filter(r => r.status !== 'resolved').length
  const participants = users.filter(u => u.role === 'participant').length
  const leaders = users.filter(u => u.role === 'leader').length
  const miniteams = users.filter(u => u.role === 'miniteam').length
  const admins = users.filter(u => u.role === 'admin').length
  const blocked = users.filter(u => u.blocked).length
  const withoutGroup = users.filter(u => !u.groupId).length
  const withoutDiocese = users.filter(u => !u.dioceseId).length
  const withoutPhone = users.filter(u => !u.phone).length

  const moveMutation = useMutation({
    mutationFn: async (move: OrganizationMove) => {
      if (move.type === 'group') {
        const group = groups.find(candidate => candidate.id === move.groupId)
        if (!group) throw new Error('Gruppe wurde nicht gefunden.')
        await updateGroup(group.id, group.name, move.dioceseId)
        return
      }
      await updateUserAssignment(move.uid, move.type === 'person-to-group'
        ? { kind: 'group', groupId: move.groupId }
        : { kind: 'miniteam', dioceseId: move.dioceseId })
    },
    onMutate: async move => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['users'] }),
        queryClient.cancelQueries({ queryKey: ['groups'] }),
      ])
      const previousUsers = queryClient.getQueryData<AppUser[]>(['users'])
      const previousGroups = queryClient.getQueryData<Group[]>(['groups'])

      if (move.type === 'group') {
        queryClient.setQueryData<Group[]>(['groups'], current => current?.map(group =>
          group.id === move.groupId ? { ...group, dioceseId: move.dioceseId } : group,
        ))
        queryClient.setQueryData<AppUser[]>(['users'], current => current?.map(user =>
          user.groupId === move.groupId ? { ...user, dioceseId: move.dioceseId } : user,
        ))
      } else if (move.type === 'person-to-group') {
        queryClient.setQueryData<AppUser[]>(['users'], current => current?.map(user =>
          user.uid === move.uid
            ? {
                ...user,
                groupId: move.groupId,
                dioceseId: move.dioceseId,
                role: user.role === 'miniteam' ? 'participant' : user.role,
              }
            : user,
        ))
      } else {
        queryClient.setQueryData<AppUser[]>(['users'], current => current?.map(user =>
          user.uid === move.uid
            ? { ...user, groupId: null, dioceseId: move.dioceseId, role: 'miniteam' }
            : user,
        ))
      }

      return { previousUsers, previousGroups }
    },
    onSuccess: async (_, move) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['groups'] }),
      ])
      const person = 'uid' in move ? users.find(user => user.uid === move.uid) : null
      const group = move.type === 'group'
        ? groups.find(candidate => candidate.id === move.groupId)
        : move.type === 'person-to-group'
          ? groups.find(candidate => candidate.id === move.groupId)
          : null
      const diocese = dioceses.find(candidate => candidate.id === move.dioceseId)
      setMoveMessage(move.type === 'group'
        ? `${group?.name ?? 'Gruppe'} wurde nach ${diocese?.name ?? 'Bistum'} verschoben. Alle Mitglieder wurden mit umgetragen.`
        : move.type === 'person-to-group'
          ? `${person?.name ?? 'Person'} gehört jetzt zu ${group?.name ?? 'der Gruppe'} in ${diocese?.name ?? 'dem Bistum'}.`
          : `${person?.name ?? 'Person'} gehört jetzt zum Mini-Team von ${diocese?.name ?? 'dem Bistum'}.`)
    },
    onError: (error, _move, context) => {
      if (context?.previousUsers) queryClient.setQueryData(['users'], context.previousUsers)
      if (context?.previousGroups) queryClient.setQueryData(['groups'], context.previousGroups)
      setMoveMessage(error instanceof Error ? error.message : 'Verschieben fehlgeschlagen.')
    },
  })

  const kpis = [
    { label: 'Personen', value: totalUsers },
    { label: 'Gruppen', value: totalGroups },
    { label: 'Bistümer', value: totalDioceses },
    { label: 'Aktive Notfälle', value: activeEmergencies, warn: activeEmergencies > 0 },
    { label: 'Leiter', value: leaders },
  ]

  const roles = [
    { label: 'Teilnehmer', count: participants, bar: 'bg-hairline-strong' },
    { label: 'Leiter', count: leaders, bar: 'bg-[#86efac]' },
    { label: 'Miniteam', count: miniteams, bar: 'bg-[#c4b5fd]' },
    { label: 'Admin', count: admins, bar: 'bg-canvas-deep' },
  ]

  const completeness = [
    { label: 'Ohne Gruppe', value: withoutGroup },
    { label: 'Ohne Bistum', value: withoutDiocese },
    { label: 'Ohne Telefon', value: withoutPhone },
    { label: 'Gesperrt', value: blocked },
  ]

  if (loadingUsers) {
    return (
      <div className="p-8 text-muted text-[15px]">Lade…</div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h2
          className="font-display text-[32px] text-ink"
          style={{ fontWeight: 300, letterSpacing: '-0.32px' }}
        >
          Übersicht
        </h2>
        <p className="text-muted text-[13px] mt-0.5 tracking-[0.16px]">
          Rom 2028 · Aktualisiert alle 30 s
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {kpis.map(k => (
          <div
            key={k.label}
            className={`rounded-xl border p-4 ${k.warn ? 'bg-red-50 border-red-200' : 'bg-surface border-hairline'}`}
          >
            <p className={`text-[11px] font-semibold tracking-[0.8px] uppercase mb-1.5 ${k.warn ? 'text-[#dc2626]' : 'text-muted'}`}>
              {k.label}
            </p>
            <p
              className={`font-display text-[36px] leading-none ${k.warn ? 'text-[#dc2626]' : 'text-ink'}`}
              style={{ fontWeight: 300 }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Role distribution + Completeness */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-surface border border-hairline rounded-xl p-5">
          <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted mb-4">
            Rollenverteilung
          </p>
          <div className="space-y-3">
            {roles.map(r => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="text-[13px] text-body w-20 shrink-0">{r.label}</span>
                <div className="flex-1 h-2 bg-canvas rounded-pill overflow-hidden">
                  <div
                    className={`h-full rounded-pill ${r.bar}`}
                    style={{ width: totalUsers > 0 ? `${(r.count / totalUsers) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-[13px] font-medium tabular-nums text-ink w-6 text-right shrink-0">
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-hairline rounded-xl p-5">
          <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted mb-4">
            Vollständigkeit
          </p>
          <div className="space-y-3">
            {completeness.map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-[14px] text-body">{s.label}</span>
                <span
                  className={`text-[14px] font-medium tabular-nums ${s.value > 0 ? 'text-[#dc2626]' : 'text-[#16a34a]'}`}
                >
                  {s.value > 0 ? s.value : '✓'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Org tree */}
      <div className="bg-surface border border-hairline rounded-xl p-5">
        <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted mb-1">
          Struktur
        </p>
        <p className="text-[12px] text-muted-soft mb-4">
          Bistümer → Gruppen / Mini-Teams → Personen
        </p>
        {(appUser?.role === 'admin' || appUser?.role === 'miniteam') && (
          <p className="text-[12px] text-body mb-4">
            Ziehe Gruppen am Griff auf ein Bistum. Personen kannst du auf eine Gruppe oder das Mini-Team eines Bistums ziehen.
          </p>
        )}
        {moveMessage && (
          <div
            role="status"
            className={`mb-4 rounded-lg border px-3 py-2 text-[12px] ${moveMutation.isError ? 'border-red-200 bg-red-50 text-[#dc2626]' : 'border-[#bbf7d0] bg-[#f0faf4] text-[#166534]'}`}
          >
            {moveMessage}
          </div>
        )}
        {totalUsers === 0 ? (
          <p className="text-muted text-[14px] py-4">Noch keine Personen eingetragen.</p>
        ) : (
          <OrganizationTree
            users={users}
            groups={groups}
            dioceses={dioceses}
            canEdit={appUser?.role === 'admin' || appUser?.role === 'miniteam'}
            isMoving={moveMutation.isPending}
            onMove={move => {
              setMoveMessage(null)
              moveMutation.mutate(move)
            }}
          />
        )}
      </div>

      {/* Diocese detail table */}
      {dioceses.length > 0 && (
        <div className="bg-surface border border-hairline rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline">
            <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted">
              Bistümer im Detail
            </p>
          </div>
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold tracking-[0.6px] uppercase text-muted">Bistum</th>
                <th className="text-right px-5 py-2.5 text-[11px] font-semibold tracking-[0.6px] uppercase text-muted">Personen</th>
                <th className="text-right px-5 py-2.5 text-[11px] font-semibold tracking-[0.6px] uppercase text-muted">Gruppen</th>
                <th className="text-right px-5 py-2.5 text-[11px] font-semibold tracking-[0.6px] uppercase text-muted hidden md:table-cell">Leiter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {dioceses.map(d => {
                const dUsers = users.filter(u => u.dioceseId === d.id)
                const dLeaders = dUsers.filter(u => u.role === 'leader').length
                const dGroups = groups.filter(g => g.dioceseId === d.id).length
                return (
                  <tr key={d.id} className="hover:bg-canvas transition-colors">
                    <td className="px-5 py-3 font-medium text-ink">{d.name}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-body">{dUsers.length}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-body">{dGroups}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-body hidden md:table-cell">{dLeaders}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Groups with leaders overview */}
      {groups.length > 0 && (
        <div className="bg-surface border border-hairline rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline">
            <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted">
              Gruppen im Detail
            </p>
          </div>
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold tracking-[0.6px] uppercase text-muted">Gruppe</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold tracking-[0.6px] uppercase text-muted hidden md:table-cell">Leiter</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold tracking-[0.6px] uppercase text-muted hidden md:table-cell">Bistum</th>
                <th className="text-right px-5 py-2.5 text-[11px] font-semibold tracking-[0.6px] uppercase text-muted">Mitglieder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {groups.map(g => {
                const leader = g.leaderId ? userByUid.get(g.leaderId) : null
                const diocese = leader?.dioceseId
                  ? dioceses.find(d => d.id === leader.dioceseId)
                  : null
                const memberCount = usersByGroup.get(g.id) ?? 0
                return (
                  <tr key={g.id} className="hover:bg-canvas transition-colors">
                    <td className="px-5 py-3 font-medium text-ink">{g.name}</td>
                    <td className="px-5 py-3 text-body hidden md:table-cell">
                      {g.leaderName ?? <span className="text-muted-soft italic">Kein Leiter</span>}
                    </td>
                    <td className="px-5 py-3 text-body hidden md:table-cell">
                      {diocese?.name ?? <span className="text-muted-soft">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-body">{memberCount}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
