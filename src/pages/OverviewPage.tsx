import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAllUsers, updateUserAssignment } from '../api/users'
import { fetchGroups, setGroupLeaderRole, setPrimaryGroupLeader, updateGroup } from '../api/groups'
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
    enabled: appUser?.role === 'miniteam' || appUser?.role === 'admin',
  })

  const isMiniteam = appUser?.role === 'miniteam'
  const isLeader = appUser?.role === 'leader'
  const isDioceseScoped = isMiniteam || isLeader
  const visibleUsers = useMemo(
    () => isLeader
      ? users.filter(user => user.groupId === appUser.groupId)
      : isMiniteam
        ? users.filter(user => user.dioceseId === appUser.dioceseId)
        : users,
    [appUser?.dioceseId, appUser?.groupId, isLeader, isMiniteam, users],
  )
  const visibleGroups = useMemo(
    () => isLeader
      ? groups.filter(group => group.id === appUser.groupId)
      : isMiniteam
        ? groups.filter(group => group.dioceseId === appUser.dioceseId)
        : groups,
    [appUser?.dioceseId, appUser?.groupId, groups, isLeader, isMiniteam],
  )
  const visibleDioceses = useMemo(
    () => isDioceseScoped ? dioceses.filter(diocese => diocese.id === appUser.dioceseId) : dioceses,
    [appUser?.dioceseId, dioceses, isDioceseScoped],
  )
  const ownDiocese = isDioceseScoped ? visibleDioceses[0] : null
  const ownGroup = isLeader ? visibleGroups[0] : null
  const organizationUsers = useMemo(
    () => visibleUsers.filter(user => user.role !== 'admin'),
    [visibleUsers],
  )
  const visibleReports = useMemo(
    () => isMiniteam ? reports.filter(report => report.dioceseId === appUser.dioceseId) : reports,
    [appUser?.dioceseId, isMiniteam, reports],
  )

  const userByUid = useMemo(() => new Map(visibleUsers.map(u => [u.uid, u])), [visibleUsers])

  const usersByDiocese = useMemo(() => {
    const m = new Map<string | null, number>()
    for (const u of visibleUsers) m.set(u.dioceseId, (m.get(u.dioceseId) ?? 0) + 1)
    return m
  }, [visibleUsers])

  const usersByGroup = useMemo(() => {
    const m = new Map<string | null, number>()
    for (const u of visibleUsers) m.set(u.groupId, (m.get(u.groupId) ?? 0) + 1)
    return m
  }, [visibleUsers])

  const totalUsers = visibleUsers.length
  const totalGroups = visibleGroups.length
  const totalDioceses = visibleDioceses.length
  const activeEmergencies = visibleReports.filter(r => r.status !== 'resolved').length
  const participants = visibleUsers.filter(u => u.role === 'participant').length
  const leaders = visibleUsers.filter(u => u.role === 'leader').length
  const miniteams = visibleUsers.filter(u => u.role === 'miniteam').length
  const admins = visibleUsers.filter(u => u.role === 'admin').length
  const blocked = visibleUsers.filter(u => u.blocked).length
  const withoutAssignment = visibleUsers.filter(u =>
    !u.groupId && u.role !== 'miniteam' && u.role !== 'admin',
  ).length
  const withoutDiocese = visibleUsers.filter(u => !u.dioceseId).length
  const withoutPhone = visibleUsers.filter(u => !u.phone).length

  const moveMutation = useMutation({
    mutationFn: async (move: OrganizationMove) => {
      if (move.type === 'group') {
        const group = visibleGroups.find(candidate => candidate.id === move.groupId)
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
      const person = 'uid' in move ? visibleUsers.find(user => user.uid === move.uid) : null
      const group = move.type === 'group'
        ? visibleGroups.find(candidate => candidate.id === move.groupId)
        : move.type === 'person-to-group'
          ? visibleGroups.find(candidate => candidate.id === move.groupId)
          : null
      const diocese = visibleDioceses.find(candidate => candidate.id === move.dioceseId)
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

  const primaryLeaderMutation = useMutation({
    mutationFn: ({ groupId, leaderId }: { groupId: string; leaderId: string }) =>
      setPrimaryGroupLeader(groupId, leaderId),
    onMutate: async ({ groupId, leaderId }) => {
      await queryClient.cancelQueries({ queryKey: ['groups'] })
      const previousGroups = queryClient.getQueryData<Group[]>(['groups'])
      const leader = visibleUsers.find(user => user.uid === leaderId)
      queryClient.setQueryData<Group[]>(['groups'], current => current?.map(group =>
        group.id === groupId
          ? {
              ...group,
              primaryLeaderId: leaderId,
              leaderId,
              leaderName: leader?.name ?? group.leaderName,
              leaderPhone: leader?.phone ?? group.leaderPhone,
            }
          : group,
      ))
      return { previousGroups, leaderName: leader?.name }
    },
    onSuccess: async (_, _variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ['groups'] })
      setMoveMessage(`${context?.leaderName ?? 'Die Person'} ist jetzt Hauptansprechpartner der Gruppe.`)
    },
    onError: (error, _variables, context) => {
      if (context?.previousGroups) queryClient.setQueryData(['groups'], context.previousGroups)
      setMoveMessage(error instanceof Error ? error.message : 'Hauptansprechpartner konnte nicht gespeichert werden.')
    },
  })

  const leaderRoleMutation = useMutation({
    mutationFn: ({ groupId, userId, assign }: { groupId: string; userId: string; assign: boolean }) =>
      setGroupLeaderRole(groupId, userId, assign),
    onMutate: async ({ groupId, userId, assign }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['users'] }),
        queryClient.cancelQueries({ queryKey: ['groups'] }),
      ])
      const previousUsers = queryClient.getQueryData<AppUser[]>(['users'])
      const previousGroups = queryClient.getQueryData<Group[]>(['groups'])
      const person = visibleUsers.find(user => user.uid === userId)
      const group = visibleGroups.find(candidate => candidate.id === groupId)
      const replacement = !assign && group?.primaryLeaderId === userId
        ? visibleUsers.find(user => user.groupId === groupId && user.role === 'leader' && user.uid !== userId)
        : null

      queryClient.setQueryData<AppUser[]>(['users'], current => current?.map(user =>
        user.uid === userId ? { ...user, role: assign ? 'leader' : 'participant' } : user,
      ))
      queryClient.setQueryData<Group[]>(['groups'], current => current?.map(candidate => {
        if (candidate.id !== groupId) return candidate
        const becomesPrimary = assign && candidate.leaderCount === 0
        const losesPrimary = !assign && candidate.primaryLeaderId === userId
        return {
          ...candidate,
          leaderCount: Math.max(0, candidate.leaderCount + (assign ? 1 : -1)),
          primaryLeaderId: becomesPrimary ? userId : losesPrimary ? replacement?.uid ?? null : candidate.primaryLeaderId,
          leaderId: becomesPrimary ? userId : losesPrimary ? replacement?.uid ?? null : candidate.leaderId,
          leaderName: becomesPrimary ? person?.name ?? null : losesPrimary ? replacement?.name ?? null : candidate.leaderName,
          leaderPhone: becomesPrimary ? person?.phone ?? null : losesPrimary ? replacement?.phone ?? null : candidate.leaderPhone,
        }
      }))
      return { previousUsers, previousGroups, personName: person?.name }
    },
    onSuccess: async (_, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['groups'] }),
      ])
      setMoveMessage(variables.assign
        ? `${context?.personName ?? 'Die Person'} ist jetzt Leiter der Gruppe und hat Zugriff auf alle Gruppenfunktionen.`
        : `${context?.personName ?? 'Die Person'} ist jetzt wieder Teilnehmer.`)
    },
    onError: (error, _variables, context) => {
      if (context?.previousUsers) queryClient.setQueryData(['users'], context.previousUsers)
      if (context?.previousGroups) queryClient.setQueryData(['groups'], context.previousGroups)
      setMoveMessage(error instanceof Error ? error.message : 'Leiterrolle konnte nicht geändert werden.')
    },
  })

  const kpis = isLeader ? [
    { label: 'Personen', value: totalUsers },
    { label: 'Teilnehmer', value: participants },
    { label: 'Leiter', value: leaders },
    { label: 'Ohne Telefon', value: withoutPhone, warn: withoutPhone > 0 },
  ] : isMiniteam ? [
    { label: 'Personen', value: totalUsers },
    { label: 'Gruppen', value: totalGroups },
    { label: 'Aktive Notfälle', value: activeEmergencies, warn: activeEmergencies > 0 },
    { label: 'Leiter', value: leaders },
    { label: 'Mini-Team', value: miniteams },
  ] : [
    { label: 'Personen', value: totalUsers },
    { label: 'Gruppen', value: totalGroups },
    { label: 'Bistümer', value: totalDioceses },
    { label: 'Aktive Notfälle', value: activeEmergencies, warn: activeEmergencies > 0 },
    { label: 'Leiter', value: leaders },
  ]

  const roles = isLeader ? [
    { label: 'Teilnehmer', count: participants, bar: 'bg-hairline-strong' },
    { label: 'Leiter', count: leaders, bar: 'bg-[#86efac]' },
  ] : [
    { label: 'Teilnehmer', count: participants, bar: 'bg-hairline-strong' },
    { label: 'Leiter', count: leaders, bar: 'bg-[#86efac]' },
    { label: 'Miniteam', count: miniteams, bar: 'bg-[#c4b5fd]' },
    { label: 'Admin', count: admins, bar: 'bg-canvas-deep' },
  ]

  const completeness = isLeader ? [
    { label: 'Ohne Telefon', value: withoutPhone },
    { label: 'Gesperrt', value: blocked },
  ] : [
    { label: 'Ohne Zuordnung', value: withoutAssignment },
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
          {ownGroup
            ? `${ownGroup.name} · ${ownDiocese?.name ?? 'Bistum'} · `
            : ownDiocese
              ? `${ownDiocese.name} · `
              : 'Rom 2028 · '}Aktualisiert alle 30 s
        </p>
      </div>

      {/* KPI row */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${isLeader ? 'md:grid-cols-4' : 'md:grid-cols-5'}`}>
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
          {isLeader ? 'Bistum → eigene Gruppe → Leitung und Mitglieder' : 'Bistümer → Gruppen / Mini-Teams → Personen'}
        </p>
        {(appUser?.role === 'admin' || appUser?.role === 'miniteam') && (
          <p className="text-[12px] text-body mb-4">
            Ziehe Gruppen am Griff auf ein Bistum und Personen auf eine Gruppe oder das Mini-Team.
            Mit L+ weist du die Leiterrolle zu; der Stern markiert den Hauptansprechpartner.
          </p>
        )}
        {moveMessage && (
          <div
            role="status"
            className={`mb-4 rounded-lg border px-3 py-2 text-[12px] ${moveMutation.isError || primaryLeaderMutation.isError || leaderRoleMutation.isError ? 'border-red-200 bg-red-50 text-[#dc2626]' : 'border-[#bbf7d0] bg-[#f0faf4] text-[#166534]'}`}
          >
            {moveMessage}
          </div>
        )}
        {totalUsers === 0 ? (
          <p className="text-muted text-[14px] py-4">Noch keine Personen eingetragen.</p>
        ) : (
          <OrganizationTree
            users={organizationUsers}
            groups={visibleGroups}
            dioceses={visibleDioceses}
            rootLabel={ownDiocese?.name}
            showEventRoot={!isDioceseScoped}
            showMiniteam={!isLeader}
            canEdit={appUser?.role === 'admin' || appUser?.role === 'miniteam'}
            canSetPrimaryLeader={appUser?.role === 'admin' || appUser?.role === 'miniteam' || isLeader}
            canManageLeaders={appUser?.role === 'admin' || appUser?.role === 'miniteam'}
            isMoving={moveMutation.isPending || primaryLeaderMutation.isPending || leaderRoleMutation.isPending}
            onMove={move => {
              setMoveMessage(null)
              moveMutation.mutate(move)
            }}
            onSetPrimaryLeader={(groupId, leaderId) => {
              setMoveMessage(null)
              primaryLeaderMutation.mutate({ groupId, leaderId })
            }}
            onToggleLeader={(groupId, userId, assign) => {
              setMoveMessage(null)
              leaderRoleMutation.mutate({ groupId, userId, assign })
            }}
          />
        )}
      </div>

      {/* Diocese detail table */}
      {!isLeader && visibleDioceses.length > 0 && (
        <div className="bg-surface border border-hairline rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline">
            <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted">
              {isMiniteam ? 'Mein Bistum' : 'Bistümer im Detail'}
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
              {visibleDioceses.map(d => {
                const dUsers = visibleUsers.filter(u => u.dioceseId === d.id)
                const dLeaders = dUsers.filter(u => u.role === 'leader').length
                const dGroups = visibleGroups.filter(g => g.dioceseId === d.id).length
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
      {visibleGroups.length > 0 && (
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
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold tracking-[0.6px] uppercase text-muted hidden md:table-cell">Hauptansprechpartner</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold tracking-[0.6px] uppercase text-muted hidden md:table-cell">Bistum</th>
                <th className="text-right px-5 py-2.5 text-[11px] font-semibold tracking-[0.6px] uppercase text-muted">Mitglieder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {visibleGroups.map(g => {
                const leader = g.leaderId ? userByUid.get(g.leaderId) : null
                const diocese = visibleDioceses.find(d => d.id === g.dioceseId)
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
