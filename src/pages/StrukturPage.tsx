import { useState, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDioceses, reorderDioceses } from '../api/dioceses'
import { fetchGroups, updateGroup } from '../api/groups'
import { fetchAllUsers, updateUserDiocese, updateUserRole, updateUserGroup } from '../api/users'
import type { Diocese, Group, AppUser } from '../types'

const roleLabel: Record<string, string> = {
  participant: 'Teilnehmer/in',
  leader: 'Leiter/in',
  miniteam: 'Miniteam',
  admin: 'Admin',
}

const ONLINE_THRESHOLD_S = 5 * 60

function isOnline(u: AppUser): boolean {
  return !!u.lastSeenAt && Math.floor(Date.now() / 1000) - u.lastSeenAt < ONLINE_THRESHOLD_S
}

// ─── SortableDioceseTile ────────────────────────────────────────────────────

interface TileProps {
  diocese: Diocese
  tileGroups: Group[]
  tileMembers: AppUser[]
  allDioceses: Diocese[]
  allGroups: Group[]
  onGroupMove: (groupId: string, name: string, newDioceseId: string | null) => void
  onPersonDioceseChange: (uid: string, newDioceseId: string | null) => void
  onPersonGroupChange: (uid: string, newGroupId: string | null) => void
  onPromoteMiniteam: (uid: string) => void
  onDemoteMiniteam: (uid: string) => void
}

function SortableDioceseTile({
  diocese,
  tileGroups,
  tileMembers,
  allDioceses,
  allGroups,
  onGroupMove,
  onPersonDioceseChange,
  onPersonGroupChange,
  onPromoteMiniteam,
  onDemoteMiniteam,
}: TileProps) {
  const [personsExpanded, setPersonsExpanded] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: diocese.id,
  })

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  const miniteam = tileMembers.filter(u => u.role === 'miniteam')
  const others = tileMembers.filter(u => u.role !== 'miniteam' && u.role !== 'admin')
  const groupsForDiocese = allGroups.filter(g => g.dioceseId === diocese.id)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-72 shrink-0 bg-surface border border-hairline rounded-xl flex flex-col overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] max-h-[calc(100vh-160px)]"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-hairline bg-canvas shrink-0">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted hover:text-ink p-0.5 shrink-0 touch-none"
          aria-label="Kachel verschieben"
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
            <circle cx="3" cy="3" r="1.5" />
            <circle cx="9" cy="3" r="1.5" />
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="9" cy="8" r="1.5" />
            <circle cx="3" cy="13" r="1.5" />
            <circle cx="9" cy="13" r="1.5" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-ink truncate">{diocese.name}</p>
          <p className="text-[10px] font-mono text-muted-soft truncate">{diocese.id}</p>
        </div>
        <span className="text-[11px] text-muted bg-canvas-deep/40 rounded-full px-2 py-0.5 shrink-0">
          {tileMembers.length}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">

        {/* ── Miniteam ── */}
        <section>
          <p className="text-[10px] font-semibold tracking-[0.8px] uppercase text-muted mb-2">
            Miniteam
          </p>
          {miniteam.length === 0 ? (
            <p className="text-[12px] text-muted-soft italic px-1">Noch kein Miniteam</p>
          ) : (
            <ul className="space-y-1">
              {miniteam.map(u => (
                <li
                  key={u.uid}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-[#f5f0fa] border border-[#e9d5ff]"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: isOnline(u) ? '#22c55e' : '#d1d5db' }}
                    title={isOnline(u) ? 'Online' : 'Offline'}
                  />
                  <span className="flex-1 text-[13px] text-[#4c1d95] font-medium truncate">{u.name}</span>
                  <button
                    onClick={() => onDemoteMiniteam(u.uid)}
                    className="text-[11px] text-[#7c3aed] hover:text-[#dc2626] transition-colors shrink-0 px-1"
                    title="Miniteam-Status entfernen (→ Leitung)"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Gruppen ── */}
        <section>
          <p className="text-[10px] font-semibold tracking-[0.8px] uppercase text-muted mb-2">
            Gruppen ({tileGroups.length})
          </p>
          {tileGroups.length === 0 ? (
            <p className="text-[12px] text-muted-soft italic px-1">Keine Gruppen</p>
          ) : (
            <ul className="space-y-1.5">
              {tileGroups.map(g => (
                <li key={g.id} className="rounded-lg px-2.5 py-2 bg-canvas border border-hairline">
                  <p className="text-[13px] text-ink font-medium truncate mb-1.5">{g.name}</p>
                  {g.leaderName && (
                    <p className="text-[11px] text-muted mb-1.5 truncate">Leitung: {g.leaderName}</p>
                  )}
                  <select
                    value={diocese.id}
                    onChange={e => {
                      const val = e.target.value
                      onGroupMove(g.id, g.name, val === '__none__' ? null : val)
                    }}
                    className="w-full text-[11px] bg-surface border border-hairline rounded-md px-1.5 py-1 text-muted focus:outline-none focus:border-ink transition-colors"
                  >
                    <option value="__none__">Kein Bistum</option>
                    {allDioceses.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Personen ── */}
        <section>
          <button
            onClick={() => setPersonsExpanded(e => !e)}
            className="w-full flex items-center justify-between text-[10px] font-semibold tracking-[0.8px] uppercase text-muted mb-2 hover:text-ink transition-colors"
          >
            <span>Personen ({others.length})</span>
            <span className="text-[11px]">{personsExpanded ? '▲' : '▼'}</span>
          </button>

          {personsExpanded && (
            others.length === 0 ? (
              <p className="text-[12px] text-muted-soft italic px-1">Keine Personen</p>
            ) : (
              <ul className="space-y-1.5">
                {others.map(u => (
                  <li key={u.uid} className="rounded-lg px-2.5 py-2 bg-canvas border border-hairline">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: isOnline(u) ? '#22c55e' : '#d1d5db' }}
                        title={isOnline(u) ? 'Online' : 'Offline'}
                      />
                      <span className="flex-1 text-[13px] text-ink font-medium truncate">{u.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-strong text-muted shrink-0">
                        {roleLabel[u.role] ?? u.role}
                      </span>
                    </div>

                    {u.role !== 'admin' && (
                      <button
                        onClick={() => onPromoteMiniteam(u.uid)}
                        className="text-[11px] text-muted hover:text-[#7c3aed] transition-colors mb-1.5 block"
                        title="Als Miniteam branden"
                      >
                        Als Miniteam branden →
                      </button>
                    )}

                    <select
                      value={diocese.id}
                      onChange={e => {
                        const val = e.target.value
                        onPersonDioceseChange(u.uid, val === '__none__' ? null : val)
                      }}
                      className="w-full text-[11px] bg-surface border border-hairline rounded-md px-1.5 py-1 text-muted focus:outline-none focus:border-ink transition-colors mb-1"
                    >
                      <option value="__none__">Kein Bistum</option>
                      {allDioceses.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>

                    <select
                      value={u.groupId ?? '__none__'}
                      onChange={e => {
                        const val = e.target.value
                        onPersonGroupChange(u.uid, val === '__none__' ? null : val)
                      }}
                      className="w-full text-[11px] bg-surface border border-hairline rounded-md px-1.5 py-1 text-muted focus:outline-none focus:border-ink transition-colors"
                    >
                      <option value="__none__">Keine Gruppe</option>
                      {groupsForDiocese.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            )
          )}
        </section>
      </div>
    </div>
  )
}

// ─── UnassignedTile ─────────────────────────────────────────────────────────

interface UnassignedTileProps {
  groups: Group[]
  users: AppUser[]
  allDioceses: Diocese[]
  allGroups: Group[]
  onGroupMove: (groupId: string, name: string, dioceseId: string | null) => void
  onPersonDioceseChange: (uid: string, dioceseId: string | null) => void
  onPersonGroupChange: (uid: string, groupId: string | null) => void
  onPromoteMiniteam: (uid: string) => void
}

function UnassignedTile({
  groups,
  users,
  allDioceses,
  allGroups,
  onGroupMove,
  onPersonDioceseChange,
  onPersonGroupChange,
  onPromoteMiniteam,
}: UnassignedTileProps) {
  const [personsExpanded, setPersonsExpanded] = useState(false)

  if (groups.length === 0 && users.length === 0) return null

  return (
    <div className="w-72 shrink-0 bg-surface border border-hairline border-dashed rounded-xl flex flex-col overflow-hidden max-h-[calc(100vh-160px)]">
      <div className="px-3 py-2.5 border-b border-hairline shrink-0">
        <p className="text-[14px] font-medium text-muted">Ohne Bistum</p>
        <p className="text-[11px] text-muted-soft mt-0.5">
          {groups.length > 0 && `${groups.length} Gruppe${groups.length !== 1 ? 'n' : ''}`}
          {groups.length > 0 && users.length > 0 && ' · '}
          {users.length > 0 && `${users.length} Person${users.length !== 1 ? 'en' : ''}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">

        {groups.length > 0 && (
          <section>
            <p className="text-[10px] font-semibold tracking-[0.8px] uppercase text-muted mb-2">
              Gruppen
            </p>
            <ul className="space-y-1.5">
              {groups.map(g => (
                <li key={g.id} className="rounded-lg px-2.5 py-2 bg-canvas border border-hairline">
                  <p className="text-[13px] text-ink font-medium truncate mb-1.5">{g.name}</p>
                  <select
                    value="__none__"
                    onChange={e => {
                      const val = e.target.value
                      if (val !== '__none__') onGroupMove(g.id, g.name, val)
                    }}
                    className="w-full text-[11px] bg-surface border border-hairline rounded-md px-1.5 py-1 text-muted focus:outline-none focus:border-ink transition-colors"
                  >
                    <option value="__none__">Bistum zuweisen…</option>
                    {allDioceses.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </section>
        )}

        {users.length > 0 && (
          <section>
            <button
              onClick={() => setPersonsExpanded(e => !e)}
              className="w-full flex items-center justify-between text-[10px] font-semibold tracking-[0.8px] uppercase text-muted mb-2 hover:text-ink transition-colors"
            >
              <span>Personen ({users.length})</span>
              <span className="text-[11px]">{personsExpanded ? '▲' : '▼'}</span>
            </button>

            {personsExpanded && (
              <ul className="space-y-1.5">
                {users.map(u => (
                  <li key={u.uid} className="rounded-lg px-2.5 py-2 bg-canvas border border-hairline">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="flex-1 text-[13px] text-ink font-medium truncate">{u.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-strong text-muted shrink-0">
                        {roleLabel[u.role] ?? u.role}
                      </span>
                    </div>

                    {u.role !== 'admin' && u.role !== 'miniteam' && (
                      <button
                        onClick={() => onPromoteMiniteam(u.uid)}
                        className="text-[11px] text-muted hover:text-[#7c3aed] transition-colors mb-1.5 block"
                      >
                        Als Miniteam branden →
                      </button>
                    )}

                    <select
                      value="__none__"
                      onChange={e => {
                        const val = e.target.value
                        if (val !== '__none__') onPersonDioceseChange(u.uid, val)
                      }}
                      className="w-full text-[11px] bg-surface border border-hairline rounded-md px-1.5 py-1 text-muted focus:outline-none focus:border-ink transition-colors mb-1"
                    >
                      <option value="__none__">Bistum zuweisen…</option>
                      {allDioceses.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>

                    <select
                      value={u.groupId ?? '__none__'}
                      onChange={e => {
                        const val = e.target.value
                        onPersonGroupChange(u.uid, val === '__none__' ? null : val)
                      }}
                      className="w-full text-[11px] bg-surface border border-hairline rounded-md px-1.5 py-1 text-muted focus:outline-none focus:border-ink transition-colors"
                    >
                      <option value="__none__">Gruppe zuweisen…</option>
                      {allGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

// ─── StrukturPage ────────────────────────────────────────────────────────────

export function StrukturPage() {
  const queryClient = useQueryClient()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const { data: diocesesRaw = [], isLoading } = useQuery({
    queryKey: ['dioceses'],
    queryFn: fetchDioceses,
  })
  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  })
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchAllUsers,
  })

  const [localOrder, setLocalOrder] = useState<string[] | null>(null)

  const sortedDioceses = useMemo<Diocese[]>(() =>
    localOrder
      ? localOrder.flatMap(id => { const d = diocesesRaw.find(d2 => d2.id === id); return d ? [d] : [] })
      : [...diocesesRaw].sort((a, b) => a.sortOrder - b.sortOrder),
    [diocesesRaw, localOrder]
  )

  const reorderMutation = useMutation({
    mutationFn: (order: { id: string; sortOrder: number }[]) => reorderDioceses(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dioceses'] })
      setLocalOrder(null)
    },
    onError: () => setLocalOrder(null),
  })

  const moveDioceseMutation = useMutation({
    mutationFn: ({ uid, dioceseId }: { uid: string; dioceseId: string | null }) =>
      updateUserDiocese(uid, dioceseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const moveGroupMutation = useMutation({
    mutationFn: ({ groupId, name, dioceseId }: { groupId: string; name: string; dioceseId: string | null }) =>
      updateGroup(groupId, name, dioceseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })

  const changeGroupMutation = useMutation({
    mutationFn: ({ uid, groupId }: { uid: string; groupId: string | null }) =>
      updateUserGroup(uid, groupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const promoteMutation = useMutation({
    mutationFn: (uid: string) => updateUserRole(uid, 'miniteam'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const demoteMutation = useMutation({
    mutationFn: (uid: string) => updateUserRole(uid, 'leader'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const ids = sortedDioceses.map(d => d.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(ids, oldIndex, newIndex)
    setLocalOrder(newOrder)
    reorderMutation.mutate(newOrder.map((id, i) => ({ id, sortOrder: i })))
  }

  const unassignedGroups = groups.filter(g => !g.dioceseId)
  const unassignedUsers = users.filter(u => !u.dioceseId && u.role !== 'admin')

  if (isLoading) {
    return <p className="p-8 text-muted text-[15px]">Lade…</p>
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="mb-6 shrink-0">
        <h2 className="font-display text-[32px] text-ink" style={{ fontWeight: 300, letterSpacing: '-0.32px' }}>
          Struktur
        </h2>
        <p className="text-muted text-[13px] mt-0.5 tracking-[0.16px]">
          {sortedDioceses.length} Bistümer · Kacheln am Griff ziehen zum Sortieren
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedDioceses.map(d => d.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 items-start flex-1 min-h-0">
            {sortedDioceses.map(diocese => (
              <SortableDioceseTile
                key={diocese.id}
                diocese={diocese}
                tileGroups={groups.filter(g => g.dioceseId === diocese.id)}
                tileMembers={users.filter(u => u.dioceseId === diocese.id)}
                allDioceses={sortedDioceses}
                allGroups={groups}
                onGroupMove={(groupId, name, newDioceseId) =>
                  moveGroupMutation.mutate({ groupId, name, dioceseId: newDioceseId })
                }
                onPersonDioceseChange={(uid, newDioceseId) =>
                  moveDioceseMutation.mutate({ uid, dioceseId: newDioceseId })
                }
                onPersonGroupChange={(uid, newGroupId) =>
                  changeGroupMutation.mutate({ uid, groupId: newGroupId })
                }
                onPromoteMiniteam={uid => promoteMutation.mutate(uid)}
                onDemoteMiniteam={uid => demoteMutation.mutate(uid)}
              />
            ))}

            <UnassignedTile
              groups={unassignedGroups}
              users={unassignedUsers}
              allDioceses={sortedDioceses}
              allGroups={groups}
              onGroupMove={(groupId, name, dioceseId) =>
                moveGroupMutation.mutate({ groupId, name, dioceseId })
              }
              onPersonDioceseChange={(uid, dioceseId) =>
                moveDioceseMutation.mutate({ uid, dioceseId })
              }
              onPersonGroupChange={(uid, groupId) =>
                changeGroupMutation.mutate({ uid, groupId })
              }
              onPromoteMiniteam={uid => promoteMutation.mutate(uid)}
            />
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
