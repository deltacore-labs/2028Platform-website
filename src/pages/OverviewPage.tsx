import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAllUsers } from '../api/users'
import { fetchGroups } from '../api/groups'
import { fetchDioceses } from '../api/dioceses'
import { fetchEmergencyReports } from '../api/emergency'
import type { AppUser, Group, Diocese } from '../types'

const NW = 184
const NH = 78
const ROW_GAP = 140
const COL_GAP = 14
const DIO_GAP = 32
const PAD = 48

interface TNode {
  id: string
  type: 'root' | 'diocese' | 'group'
  label: string
  sub: string
  sub2?: string
  count: number
  x: number
  y: number
  parentId: string | null
}

function buildLayout(
  users: AppUser[],
  groups: Group[],
  dioceses: Diocese[],
  usersByDiocese: Map<string | null, number>,
  usersByGroup: Map<string | null, number>,
  userByUid: Map<string, AppUser>,
): { nodes: TNode[]; totalW: number; totalH: number } {
  const groupDioId = (g: Group): string | null => {
    if (!g.leaderId) return null
    return userByUid.get(g.leaderId)?.dioceseId ?? null
  }

  const groupsByDio = new Map<string | null, Group[]>()
  for (const g of groups) {
    const dId = groupDioId(g)
    if (!groupsByDio.has(dId)) groupsByDio.set(dId, [])
    groupsByDio.get(dId)!.push(g)
  }

  const hasOrphan = groupsByDio.has(null) || (usersByDiocese.has(null) && (usersByDiocese.get(null) ?? 0) > 0)
  const dioEntries: { id: string | null; name: string }[] = [
    ...dioceses,
    ...(hasOrphan ? [{ id: null as null, name: 'Kein Bistum' }] : []),
  ]

  const nodes: TNode[] = []
  let curX = PAD
  const dioCenterXs: number[] = []

  for (const d of dioEntries) {
    const dGroups = groupsByDio.get(d.id) ?? []
    const slots = Math.max(1, dGroups.length)
    const colW = slots * NW + (slots - 1) * COL_GAP
    const dioCX = curX + colW / 2
    dioCenterXs.push(dioCX)

    const dCount = usersByDiocese.get(d.id) ?? 0
    nodes.push({
      id: d.id ?? '__none__',
      type: 'diocese',
      label: d.name,
      sub: `${dCount} ${dCount === 1 ? 'Person' : 'Personen'}`,
      count: dCount,
      x: dioCX - NW / 2,
      y: PAD + ROW_GAP,
      parentId: 'root',
    })

    for (let i = 0; i < dGroups.length; i++) {
      const g = dGroups[i]
      const mCount = usersByGroup.get(g.id) ?? 0
      nodes.push({
        id: g.id,
        type: 'group',
        label: g.name,
        sub: `${mCount} ${mCount === 1 ? 'Mitglied' : 'Mitglieder'}`,
        sub2: g.leaderName ? `Leiter: ${g.leaderName}` : 'Kein Leiter',
        count: mCount,
        x: curX + i * (NW + COL_GAP),
        y: PAD + 2 * ROW_GAP,
        parentId: d.id ?? '__none__',
      })
    }

    curX += colW + DIO_GAP
  }

  const allCX = dioCenterXs.length > 0 ? dioCenterXs : [PAD + NW / 2]
  const rootCX = (Math.min(...allCX) + Math.max(...allCX)) / 2
  const total = users.length

  nodes.unshift({
    id: 'root',
    type: 'root',
    label: 'Rom 2028 Pilgerfahrt',
    sub: `${total} ${total === 1 ? 'Person' : 'Personen'} gesamt`,
    count: total,
    x: rootCX - NW / 2,
    y: PAD,
    parentId: null,
  })

  const hasGroups = groups.length > 0
  const totalW = Math.max(curX - DIO_GAP + PAD, NW + PAD * 2)
  const totalH = PAD + (hasGroups ? 3 : 2) * ROW_GAP + NH + PAD

  return { nodes, totalW, totalH }
}

export function OverviewPage() {
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

  const { nodes, totalW, totalH } = useMemo(
    () => buildLayout(users, groups, dioceses, usersByDiocese, usersByGroup, userByUid),
    [users, groups, dioceses, usersByDiocese, usersByGroup, userByUid],
  )

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes])

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
          Bistümer → Gruppen · Verbindungen zeigen Zugehörigkeit des Gruppenleiters
        </p>
        {totalUsers === 0 ? (
          <p className="text-muted text-[14px] py-4">Noch keine Personen eingetragen.</p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="relative" style={{ width: totalW, height: totalH, minWidth: NW + PAD * 2 }}>
              {/* SVG edge layer */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width={totalW}
                height={totalH}
              >
                <defs>
                  <marker
                    id="arrow"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L6,3 z" fill="#d6d3d1" />
                  </marker>
                </defs>
                {nodes
                  .filter(n => n.parentId)
                  .map(n => {
                    const parent = nodeMap.get(n.parentId!)
                    if (!parent) return null
                    const x1 = parent.x + NW / 2
                    const y1 = parent.y + NH
                    const x2 = n.x + NW / 2
                    const y2 = n.y
                    const cy = (y1 + y2) / 2
                    return (
                      <path
                        key={`edge-${n.id}`}
                        d={`M ${x1} ${y1} C ${x1} ${cy} ${x2} ${cy} ${x2} ${y2}`}
                        fill="none"
                        stroke="#d6d3d1"
                        strokeWidth="1.5"
                        markerEnd="url(#arrow)"
                      />
                    )
                  })}
              </svg>

              {/* Node cards */}
              {nodes.map(n => (
                <div
                  key={n.id}
                  className={`absolute rounded-xl border flex flex-col justify-center px-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${
                    n.type === 'root'
                      ? 'bg-canvas-deep border-canvas-deep'
                      : n.type === 'diocese'
                      ? 'bg-surface border-hairline-strong'
                      : 'bg-surface border-hairline'
                  }`}
                  style={{ left: n.x, top: n.y, width: NW, height: NH }}
                >
                  {n.type === 'root' && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-white/50 text-[10px]">✞</span>
                    </div>
                  )}
                  <p
                    className={`text-[13px] font-medium leading-tight truncate ${
                      n.type === 'root' ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {n.label}
                  </p>
                  <p
                    className={`text-[11px] mt-0.5 truncate ${
                      n.type === 'root' ? 'text-white/50' : 'text-muted'
                    }`}
                  >
                    {n.sub}
                  </p>
                  {n.sub2 && (
                    <p className="text-[11px] text-muted-soft truncate mt-0.5">{n.sub2}</p>
                  )}
                  {n.type !== 'root' && n.count > 0 && (
                    <div
                      className={`absolute top-2.5 right-2.5 text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-pill ${
                        n.type === 'diocese'
                          ? 'bg-canvas text-muted'
                          : 'bg-canvas text-muted'
                      }`}
                    >
                      {n.count}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
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
                const dGroups = groups.filter(g => {
                  const leader = g.leaderId ? userByUid.get(g.leaderId) : null
                  return leader?.dioceseId === d.id
                }).length
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
