import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { AppUser, Diocese, Group } from '../types'

const ROOT_W = 196
const NODE_W = 176
const PERSON_W = 184
const NODE_H = 72
const PERSON_H = 58
const LEVEL_GAP = 112
const SIBLING_GAP = 14
const DIOCESE_GAP = 36
const PAD = 42

type TreeNodeType = 'root' | 'diocese' | 'group' | 'miniteam' | 'malteser' | 'unassigned' | 'person'
type DragItem = { type: 'group' | 'person'; id: string }
type DropTarget =
  | { type: 'diocese'; dioceseId: string }
  | { type: 'group'; groupId: string; dioceseId: string }
  | { type: 'miniteam'; dioceseId: string }
  | { type: 'malteser'; dioceseId: string }

interface TreeNode {
  key: string
  type: TreeNodeType
  entityId: string
  label: string
  sub: string
  x: number
  y: number
  width: number
  height: number
  parentKey: string | null
  dioceseId?: string
  draggable?: boolean
  groupId?: string
  isLeader?: boolean
  isPrimaryLeader?: boolean
  hasAccount?: boolean
}

interface Branch {
  type: 'group' | 'miniteam' | 'malteser' | 'unassigned'
  id: string
  name: string
  dioceseId: string
  people: AppUser[]
  primaryLeaderId: string | null
  primaryLeaderName: string | null
}

export type OrganizationMove =
  | { type: 'group'; groupId: string; dioceseId: string }
  | { type: 'person-to-group'; uid: string; groupId: string; dioceseId: string }
  | { type: 'person-to-miniteam'; uid: string; dioceseId: string }
  | { type: 'person-to-malteser'; uid: string; dioceseId: string }

interface OrganizationTreeProps {
  users: AppUser[]
  groups: Group[]
  dioceses: Diocese[]
  canEdit: boolean
  isMoving: boolean
  rootLabel?: string
  showEventRoot?: boolean
  showMiniteam?: boolean
  canSetPrimaryLeader?: boolean
  canManageLeaders?: boolean
  canCreateGroups?: boolean
  canCreateDioceses?: boolean
  onMove: (move: OrganizationMove) => void
  onCreateGroup?: (dioceseId: string) => void
  onCreatePerson?: (dioceseId: string) => void
  onCreateDiocese?: () => void
  onSelectPerson?: (uid: string) => void
  onSetPrimaryLeader?: (groupId: string, leaderId: string) => void
  onToggleLeader?: (groupId: string, userId: string, assign: boolean) => void
}

const roleLabel: Record<AppUser['role'], string> = {
  participant: 'Teilnehmer',
  leader: 'Leiter',
  miniteam: 'Mini-Team',
  malteser: 'Malteser',
  admin: 'Admin',
}

function branchWidth(branch: Branch) {
  return Math.max(NODE_W, branch.people.length * PERSON_W + Math.max(0, branch.people.length - 1) * SIBLING_GAP)
}

function buildTree(
  users: AppUser[],
  groups: Group[],
  dioceses: Diocese[],
  rootLabel: string,
  showEventRoot: boolean,
  showMiniteam: boolean,
) {
  const sortedDioceses = [...dioceses].sort((a, b) => a.sortOrder - b.sortOrder)
  const knownDioceses = new Set(dioceses.map(d => d.id))
  const orphanUsers = users.filter(user => !user.dioceseId || !knownDioceses.has(user.dioceseId))
  const orphanGroups = groups.filter(group => !group.dioceseId || !knownDioceses.has(group.dioceseId))
  const entries: Array<{ diocese: Pick<Diocese, 'id' | 'name'>; people: AppUser[]; groups: Group[] }> = sortedDioceses.map(diocese => ({
    diocese,
    people: users.filter(user => user.dioceseId === diocese.id),
    groups: groups.filter(group => group.dioceseId === diocese.id),
  }))

  if (orphanUsers.length > 0 || orphanGroups.length > 0) {
    entries.push({
      diocese: { id: '__unassigned__', name: 'Ohne Bistum' },
      people: orphanUsers,
      groups: orphanGroups,
    })
  }

  const nodes: TreeNode[] = []
  const dioceseCenters: number[] = []
  let cursorX = PAD

  for (const entry of entries) {
    const isOrphan = entry.diocese.id === '__unassigned__'
    const groupedIds = new Set(entry.groups.map(group => group.id))
    const branches: Branch[] = entry.groups.map(group => ({
      type: 'group',
      id: group.id,
      name: group.name,
      dioceseId: entry.diocese.id,
      people: entry.people.filter(user => user.groupId === group.id),
      primaryLeaderId: group.primaryLeaderId,
      primaryLeaderName: group.leaderName,
    }))

    if (!isOrphan && showMiniteam) {
      branches.unshift({
        type: 'miniteam',
        id: `miniteam:${entry.diocese.id}`,
        name: 'Mini-Team',
        dioceseId: entry.diocese.id,
        people: entry.people.filter(user => user.role === 'miniteam' && !user.groupId),
        primaryLeaderId: null,
        primaryLeaderName: null,
      })
      branches.splice(1, 0, {
        type: 'malteser',
        id: `malteser:${entry.diocese.id}`,
        name: 'Malteser',
        dioceseId: entry.diocese.id,
        people: entry.people.filter(user => user.role === 'malteser' && !user.groupId),
        primaryLeaderId: null,
        primaryLeaderName: null,
      })
    }

    const unassignedPeople = entry.people.filter(user =>
      (isOrphan || (user.role !== 'miniteam' && user.role !== 'malteser')) &&
        (!user.groupId || !groupedIds.has(user.groupId)),
    )
    if (unassignedPeople.length > 0 || isOrphan) {
      branches.push({
        type: 'unassigned',
        id: `unassigned:${entry.diocese.id}`,
        name: 'Nicht zugeordnet',
        dioceseId: entry.diocese.id,
        people: unassignedPeople,
        primaryLeaderId: null,
        primaryLeaderName: null,
      })
    }

    const widths = branches.map(branchWidth)
    const contentWidth = Math.max(
      NODE_W,
      widths.reduce((sum, width) => sum + width, 0) + Math.max(0, branches.length - 1) * SIBLING_GAP,
    )
    const dioceseCenter = cursorX + contentWidth / 2
    dioceseCenters.push(dioceseCenter)
    const dioceseKey = `diocese:${entry.diocese.id}`

    nodes.push({
      key: dioceseKey,
      type: 'diocese',
      entityId: entry.diocese.id,
      label: entry.diocese.name,
      sub: `${entry.people.length} ${entry.people.length === 1 ? 'Person' : 'Personen'}`,
      x: dioceseCenter - NODE_W / 2,
      y: PAD + (showEventRoot ? LEVEL_GAP : 0),
      width: NODE_W,
      height: NODE_H,
      parentKey: showEventRoot ? 'root' : null,
      dioceseId: isOrphan ? undefined : entry.diocese.id,
    })

    let branchX = cursorX
    for (let index = 0; index < branches.length; index++) {
      const branch = branches[index]
      const width = widths[index]
      const center = branchX + width / 2
      const branchKey = `${branch.type}:${branch.id}`
      nodes.push({
        key: branchKey,
        type: branch.type,
        entityId: branch.id,
        label: branch.name,
        sub: branch.type === 'group' && branch.primaryLeaderName
          ? `Hauptkontakt: ${branch.primaryLeaderName} · ${branch.people.length} Personen`
          : `${branch.people.length} ${branch.people.length === 1 ? 'Person' : 'Personen'}`,
        x: center - NODE_W / 2,
        y: PAD + (showEventRoot ? 2 : 1) * LEVEL_GAP,
        width: NODE_W,
        height: NODE_H,
        parentKey: dioceseKey,
        dioceseId: isOrphan ? undefined : branch.dioceseId,
        draggable: branch.type === 'group',
      })

      const peopleWidth = branch.people.length * PERSON_W + Math.max(0, branch.people.length - 1) * SIBLING_GAP
      let personX = center - peopleWidth / 2
      for (const person of branch.people) {
        nodes.push({
          key: `person:${person.uid}`,
          type: 'person',
          entityId: person.uid,
          label: person.name,
          sub: person.uid === branch.primaryLeaderId
            ? 'Hauptansprechpartner'
            : `${roleLabel[person.role]}${person.hasAccount ? '' : ' · kein Konto'}`,
          x: personX,
          y: PAD + (showEventRoot ? 3 : 2) * LEVEL_GAP,
          width: PERSON_W,
          height: PERSON_H,
          parentKey: branchKey,
          dioceseId: isOrphan ? undefined : branch.dioceseId,
          draggable: person.role !== 'admin',
          groupId: branch.type === 'group' ? branch.id : undefined,
          isLeader: person.role === 'leader',
          isPrimaryLeader: person.uid === branch.primaryLeaderId,
          hasAccount: person.hasAccount,
        })
        personX += PERSON_W + SIBLING_GAP
      }
      branchX += width + SIBLING_GAP
    }
    cursorX += contentWidth + DIOCESE_GAP
  }

  const rootCenter = dioceseCenters.length > 0
    ? (Math.min(...dioceseCenters) + Math.max(...dioceseCenters)) / 2
    : PAD + ROOT_W / 2
  if (showEventRoot) {
    nodes.unshift({
      key: 'root',
      type: 'root',
      entityId: 'root',
      label: rootLabel,
      sub: `${users.length} ${users.length === 1 ? 'Person' : 'Personen'} gesamt`,
      x: rootCenter - ROOT_W / 2,
      y: PAD,
      width: ROOT_W,
      height: NODE_H,
      parentKey: null,
    })
  }

  return {
    nodes,
    totalW: Math.max(cursorX - DIOCESE_GAP + PAD, (showEventRoot ? ROOT_W : NODE_W) + PAD * 2),
    totalH: PAD * 2 + LEVEL_GAP * (showEventRoot ? 3 : 2) + PERSON_H,
  }
}

function DropNode({
  node,
  activeType,
  canEdit,
  onCreateGroup,
  onCreatePerson,
}: {
  node: TreeNode
  activeType: DragItem['type'] | null
  canEdit: boolean
  onCreateGroup?: (dioceseId: string) => void
  onCreatePerson?: (dioceseId: string) => void
}) {
  const target: DropTarget | null = node.type === 'group' && node.dioceseId
    ? { type: 'group', groupId: node.entityId, dioceseId: node.dioceseId }
    : node.type === 'miniteam' && node.dioceseId
      ? { type: 'miniteam', dioceseId: node.dioceseId }
      : node.type === 'malteser' && node.dioceseId
        ? { type: 'malteser', dioceseId: node.dioceseId }
      : node.type === 'diocese' && node.dioceseId
        ? { type: 'diocese', dioceseId: node.dioceseId }
        : null
  const accepts = Boolean(target && (activeType === 'person' || (activeType === 'group' && target.type === 'diocese')))
  const { setNodeRef, isOver } = useDroppable({
    id: `drop:${node.key}`,
    data: target ?? undefined,
    disabled: !canEdit || !accepts,
  })

  return (
    <NodeCard
      node={node}
      refCallback={setNodeRef}
      isDropTarget={isOver && accepts}
      onCreateGroup={node.type === 'diocese' ? onCreateGroup : undefined}
      onCreatePerson={node.type === 'diocese' ? onCreatePerson : undefined}
    />
  )
}

function DraggableNode({
  node,
  canEdit,
  activeType,
  canSetPrimaryLeader,
  canManageLeaders,
  onSetPrimaryLeader,
  onToggleLeader,
  onSelectPerson,
}: {
  node: TreeNode
  canEdit: boolean
  activeType: DragItem['type'] | null
  canSetPrimaryLeader: boolean
  canManageLeaders: boolean
  onSetPrimaryLeader?: (groupId: string, leaderId: string) => void
  onToggleLeader?: (groupId: string, userId: string, assign: boolean) => void
  onSelectPerson?: (uid: string) => void
}) {
  const dragItem: DragItem = { type: node.type === 'group' ? 'group' : 'person', id: node.entityId }
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: `drag:${node.key}`,
    data: dragItem,
    disabled: !canEdit || !node.draggable,
  })
  const groupTarget: DropTarget | null = node.type === 'group' && node.dioceseId
    ? { type: 'group', groupId: node.entityId, dioceseId: node.dioceseId }
    : null
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop:${node.key}`,
    data: groupTarget ?? undefined,
    disabled: !canEdit || !groupTarget || activeType !== 'person',
  })
  const setNodeRef = (element: HTMLElement | null) => {
    setDragRef(element)
    setDropRef(element)
  }
  return (
    <NodeCard
      node={node}
      refCallback={setNodeRef}
      transform={transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined}
      isDragging={isDragging}
      isDropTarget={isOver && activeType === 'person'}
      dragAttributes={attributes}
      dragListeners={listeners}
      onSetPrimaryLeader={canSetPrimaryLeader ? onSetPrimaryLeader : undefined}
      onToggleLeader={canManageLeaders ? onToggleLeader : undefined}
      onSelectPerson={onSelectPerson}
    />
  )
}

function NodeCard({
  node,
  refCallback,
  transform,
  isDragging = false,
  isDropTarget = false,
  dragAttributes,
  dragListeners,
  onSetPrimaryLeader,
  onToggleLeader,
  onCreateGroup,
  onCreatePerson,
  onCreateDiocese,
  onSelectPerson,
  overlay = false,
}: {
  node: TreeNode
  refCallback?: (element: HTMLElement | null) => void
  transform?: string
  isDragging?: boolean
  isDropTarget?: boolean
  dragAttributes?: DraggableAttributes
  dragListeners?: DraggableSyntheticListeners
  onSetPrimaryLeader?: (groupId: string, leaderId: string) => void
  onToggleLeader?: (groupId: string, userId: string, assign: boolean) => void
  onCreateGroup?: (dioceseId: string) => void
  onCreatePerson?: (dioceseId: string) => void
  onCreateDiocese?: () => void
  onSelectPerson?: (uid: string) => void
  overlay?: boolean
}) {
  const dark = node.type === 'root'
  const accent = node.type === 'miniteam' || node.type === 'malteser'
  const warning = node.type === 'unassigned' || (node.type === 'diocese' && node.entityId === '__unassigned__')
  return (
    <div
      ref={refCallback}
      className={`absolute rounded-xl border flex items-center px-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-[border-color,box-shadow,opacity] ${
        dark ? 'bg-canvas-deep border-canvas-deep'
          : node.type === 'malteser' ? 'bg-red-50 border-red-200'
            : accent ? 'bg-[#f5f0fa] border-[#e9d5ff]'
            : warning ? 'bg-amber-50 border-amber-200 border-dashed'
              : 'bg-surface border-hairline'
      } ${isDropTarget ? 'ring-2 ring-[#7c3aed] ring-offset-2 border-[#7c3aed]' : ''} ${isDragging && !overlay ? 'opacity-20' : ''} ${overlay ? 'shadow-xl' : ''}`}
      style={{
        left: overlay ? 0 : node.x,
        top: overlay ? 0 : node.y,
        width: node.width,
        height: node.height,
        transform,
        zIndex: isDragging || overlay ? 20 : 1,
      }}
    >
      {node.type === 'person' && onSelectPerson ? (
        <button
          type="button"
          onClick={() => onSelectPerson(node.entityId)}
          className="min-w-0 flex-1 text-left rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]"
          aria-label={`Details zu ${node.label} anzeigen`}
        >
          <p className="text-[12px] font-medium leading-tight truncate text-ink">{node.label}</p>
          <p className="text-[10px] mt-1 truncate text-muted">{node.sub} · Details</p>
        </button>
      ) : (
        <div className="min-w-0 flex-1">
          <p className={`text-[12px] font-medium leading-tight truncate ${dark ? 'text-white' : node.type === 'malteser' ? 'text-red-800' : accent ? 'text-[#4c1d95]' : 'text-ink'}`}>
            {node.label}
          </p>
          <p className={`text-[10px] mt-1 truncate ${dark ? 'text-white/55' : node.type === 'malteser' ? 'text-red-600' : accent ? 'text-[#7c3aed]' : 'text-muted'}`}>
            {node.sub}
          </p>
        </div>
      )}
      {node.type === 'diocese' && node.dioceseId && onCreateGroup && (
        <div className="ml-1 flex shrink-0 items-center">
          {onCreatePerson && (
            <button
              type="button"
              onClick={() => onCreatePerson(node.dioceseId!)}
              className="grid h-8 min-w-8 place-items-center rounded-lg px-1 text-[10px] font-bold text-muted hover:bg-canvas hover:text-ink"
              aria-label={`Person ohne Konto in ${node.label} anlegen`}
              title="Person ohne Konto anlegen"
            >
              P+
            </button>
          )}
          <button
            type="button"
            onClick={() => onCreateGroup(node.dioceseId!)}
            className="grid h-8 min-w-8 place-items-center rounded-lg px-1 text-[10px] font-bold text-muted hover:bg-canvas hover:text-ink"
            aria-label={`Neue Gruppe in ${node.label} anlegen`}
            title="Neue Gruppe anlegen"
          >
            G+
          </button>
        </div>
      )}
      {node.type === 'root' && onCreateDiocese && (
        <button
          type="button"
          onClick={onCreateDiocese}
          className="ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-[18px] leading-none text-white hover:bg-white/20"
          aria-label="Neues Bistum anlegen"
          title="Neues Bistum anlegen"
        >
          +
        </button>
      )}
      {node.groupId && node.hasAccount !== false && onToggleLeader && (
        <button
          type="button"
          onClick={() => onToggleLeader(node.groupId!, node.entityId, !node.isLeader)}
          className={`ml-1 grid h-8 min-w-7 shrink-0 place-items-center rounded-lg px-1 text-[10px] font-bold transition-colors ${
            node.isLeader
              ? 'bg-[#f0faf4] text-[#15803d] hover:bg-red-50 hover:text-[#dc2626]'
              : 'text-muted-soft hover:bg-[#f0faf4] hover:text-[#15803d]'
          }`}
          aria-label={node.isLeader ? `${node.label} die Leiterrolle entziehen` : `${node.label} zum Leiter machen`}
          title={node.isLeader ? 'Leiterrolle entfernen' : 'Zum Leiter machen'}
        >
          {node.isLeader ? 'L−' : 'L+'}
        </button>
      )}
      {node.isLeader && node.groupId && onSetPrimaryLeader && (
        <button
          type="button"
          onClick={() => onSetPrimaryLeader(node.groupId!, node.entityId)}
          className={`ml-1 grid h-9 w-8 shrink-0 place-items-center rounded-lg text-[17px] transition-colors ${
            node.isPrimaryLeader ? 'text-amber-500' : 'text-muted-soft hover:bg-amber-50 hover:text-amber-500'
          }`}
          aria-label={`${node.label} als Hauptansprechpartner festlegen`}
          title={node.isPrimaryLeader ? 'Hauptansprechpartner' : 'Als Hauptansprechpartner festlegen'}
        >
          {node.isPrimaryLeader ? '★' : '☆'}
        </button>
      )}
      {dragListeners && (
        <button
          type="button"
          {...dragAttributes}
          {...dragListeners}
          className="ml-2 -mr-1 grid h-9 w-8 shrink-0 touch-none cursor-grab place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink active:cursor-grabbing"
          aria-label={`${node.label} verschieben`}
          title="Ziehen zum Verschieben"
        >
          <span aria-hidden="true" className="text-[16px] tracking-[-2px]">⠿</span>
        </button>
      )}
    </div>
  )
}

const collisionDetection: CollisionDetection = args => {
  const pointer = pointerWithin(args)
  if (pointer.length > 0) return pointer
  const intersections = rectIntersection(args)
  if (intersections.length > 0) return intersections
  return closestCenter(args)
}

export function OrganizationTree({
  users,
  groups,
  dioceses,
  canEdit,
  isMoving,
  rootLabel = 'Rom 2028 Pilgerfahrt',
  showEventRoot = true,
  showMiniteam = true,
  canSetPrimaryLeader = false,
  canManageLeaders = false,
  canCreateGroups = false,
  canCreateDioceses = false,
  onMove,
  onCreateGroup,
  onCreatePerson,
  onCreateDiocese,
  onSelectPerson,
  onSetPrimaryLeader,
  onToggleLeader,
}: OrganizationTreeProps) {
  const { nodes, totalW, totalH } = useMemo(
    () => buildTree(users, groups, dioceses, rootLabel, showEventRoot, showMiniteam),
    [users, groups, dioceses, rootLabel, showEventRoot, showMiniteam],
  )
  const nodeMap = useMemo(() => new Map(nodes.map(node => [node.key, node])), [nodes])
  const [active, setActive] = useState<DragItem | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragStart(event: DragStartEvent) {
    setActive(event.active.data.current as DragItem)
  }

  function handleDragEnd(event: DragEndEvent) {
    const item = event.active.data.current as DragItem | undefined
    const target = event.over?.data.current as DropTarget | undefined
    setActive(null)
    if (!item || !target || isMoving) return

    if (item.type === 'group' && target.type === 'diocese') {
      const group = groups.find(candidate => candidate.id === item.id)
      if (group && group.dioceseId !== target.dioceseId) {
        onMove({ type: 'group', groupId: item.id, dioceseId: target.dioceseId })
      }
      return
    }

    if (item.type !== 'person') return
    const person = users.find(candidate => candidate.uid === item.id)
    if (!person) return
    if (target.type === 'group') {
      if (person.groupId !== target.groupId || person.dioceseId !== target.dioceseId || person.role === 'miniteam' || person.role === 'malteser') {
        onMove({ type: 'person-to-group', uid: item.id, groupId: target.groupId, dioceseId: target.dioceseId })
      }
    } else if (target.type === 'miniteam' && (person.dioceseId !== target.dioceseId || person.groupId || person.role !== 'miniteam')) {
      onMove({ type: 'person-to-miniteam', uid: item.id, dioceseId: target.dioceseId })
    } else if (target.type === 'malteser' && (person.dioceseId !== target.dioceseId || person.groupId || person.role !== 'malteser')) {
      onMove({ type: 'person-to-malteser', uid: item.id, dioceseId: target.dioceseId })
    }
  }

  const activeNode = active
    ? nodes.find(node => node.entityId === active.id && node.type === active.type)
    : undefined

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragCancel={() => setActive(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto overscroll-x-contain -mx-1 px-1 pb-3">
        <div className="relative" style={{ width: totalW, height: totalH, minWidth: ROOT_W + PAD * 2 }}>
          <svg className="absolute inset-0 pointer-events-none" width={totalW} height={totalH} aria-hidden="true">
            {nodes.filter(node => node.parentKey).map(node => {
              const parent = nodeMap.get(node.parentKey!)
              if (!parent) return null
              const x1 = parent.x + parent.width / 2
              const y1 = parent.y + parent.height
              const x2 = node.x + node.width / 2
              const y2 = node.y
              const cy = (y1 + y2) / 2
              return (
                <path
                  key={`edge:${node.key}`}
                  d={`M ${x1} ${y1} C ${x1} ${cy} ${x2} ${cy} ${x2} ${y2}`}
                  fill="none"
                  stroke="#d6d3d1"
                  strokeWidth="1.5"
                />
              )
            })}
          </svg>

          {nodes.map(node => node.type === 'root' || node.type === 'unassigned'
            ? (
                <NodeCard
                  key={node.key}
                  node={node}
                  onCreateDiocese={node.type === 'root' && canCreateDioceses && !isMoving ? onCreateDiocese : undefined}
                />
              )
            : node.type === 'person' || node.type === 'group'
              ? (
                  <DraggableNode
                    key={node.key}
                    node={node}
                    canEdit={canEdit && !isMoving}
                    activeType={active?.type ?? null}
                    canSetPrimaryLeader={canSetPrimaryLeader && !isMoving}
                    canManageLeaders={canManageLeaders && !isMoving}
                    onSetPrimaryLeader={onSetPrimaryLeader}
                    onToggleLeader={onToggleLeader}
                    onSelectPerson={onSelectPerson}
                  />
                )
              : (
                  <DropNode
                    key={node.key}
                    node={node}
                    activeType={active?.type ?? null}
                    canEdit={canEdit && !isMoving}
                    onCreateGroup={canCreateGroups && !isMoving ? onCreateGroup : undefined}
                    onCreatePerson={canCreateGroups && !isMoving ? onCreatePerson : undefined}
                  />
                )
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }}>
        {activeNode ? (
          <div className="relative" style={{ width: activeNode.width, height: activeNode.height }}>
            <NodeCard node={activeNode} overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
