import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchEvents, createEvent, updateEvent, deleteEvent } from '../api/events'
import { fetchGroups } from '../api/groups'
import { fetchLocations } from '../api/locations'
import { LocationPicker, type EventLocation } from '../components/LocationPicker'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

const ROLE_LABELS: Record<string, string> = {
  participant: 'Teilnehmer/in',
  leader: 'Leiter/in',
  miniteam: 'Miniteam',
}

const ALL_ROLES: UserRole[] = ['participant', 'leader', 'miniteam']

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function toUnix(localDatetime: string) {
  return Math.floor(new Date(localDatetime).getTime() / 1000)
}

function defaultDatetime(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setSeconds(0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toLocalDatetime(unix: number) {
  const date = new Date(unix * 1000)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function EventsPage() {
  const queryClient = useQueryClient()
  const { appUser } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(defaultDatetime())
  const [endDate, setEndDate] = useState(defaultDatetime(1))
  const [targetRoles, setTargetRoles] = useState<UserRole[]>([])
  const [targetAudience, setTargetAudience] = useState<'all' | 'groups'>('all')
  const [targetGroupIds, setTargetGroupIds] = useState<string[]>([])
  const [eventLocation, setEventLocation] = useState<EventLocation | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterGroup, setFilterGroup] = useState('')

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  })
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        start_date: toUnix(startDate),
        end_date: toUnix(endDate),
        target_roles: targetRoles.length > 0 ? targetRoles : undefined,
        target_group_ids: targetAudience === 'groups' ? targetGroupIds : [],
      }
      return editingId
        ? updateEvent(editingId, { ...payload, location: eventLocation })
        : createEvent({ ...payload, location: eventLocation ?? undefined })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      setTitle('')
      setDescription('')
      setStartDate(defaultDatetime())
      setEndDate(defaultDatetime(1))
      setTargetRoles([])
      setTargetAudience('all')
      setTargetGroupIds([])
      setEventLocation(null)
      setShowForm(false)
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setTitle('')
    setDescription('')
    setStartDate(defaultDatetime())
    setEndDate(defaultDatetime(1))
    setTargetRoles([])
    setTargetAudience('all')
    setTargetGroupIds([])
    setEventLocation(null)
  }

  function startEdit(event: typeof events[number]) {
    setEditingId(event.id)
    setTitle(event.title)
    setDescription(event.description)
    setStartDate(toLocalDatetime(event.startDate))
    setEndDate(toLocalDatetime(event.endDate))
    try { setTargetRoles(JSON.parse(event.targetRoles)) } catch { setTargetRoles([]) }
    const eventGroupIds = (() => {
      try { return JSON.parse(event.targetGroupIds) as string[] } catch { return event.groupId ? [event.groupId] : [] }
    })()
    setTargetAudience(eventGroupIds.length > 0 ? 'groups' : 'all')
    setTargetGroupIds(eventGroupIds)
    const location = locations.find(item => item.id === event.locationId)
    setEventLocation(location ? { name: location.name, lat: location.lat, lng: location.lng } : null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function removeEvent(id: string, eventTitle: string) {
    if (confirm(`Veranstaltung „${eventTitle}“ wirklich löschen?`)) deleteMutation.mutate(id)
  }

  function toggleRole(role: UserRole) {
    setTargetRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role],
    )
  }

  function toggleGroup(groupId: string) {
    setTargetGroupIds(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId],
    )
  }

  const sortedEvents = [...events].sort((a, b) => a.startDate - b.startDate)

  const filtered = sortedEvents.filter(ev => {
    if (search && !ev.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterGroup) {
      const groupIds: string[] = (() => {
        try { return JSON.parse(ev.targetGroupIds) } catch { return ev.groupId ? [ev.groupId] : [] }
      })()
      if (!groupIds.includes(filterGroup)) return false
    }
    if (filterRole) {
      const roles: string[] = (() => { try { return JSON.parse(ev.targetRoles) } catch { return [] } })()
      if (roles.length > 0 && !roles.includes(filterRole)) return false
    }
    return true
  })

  const hasFilter = search || filterRole || filterGroup

  const inputClass = "w-full bg-surface text-ink rounded-lg px-4 py-3 border border-hairline-strong text-[15px] focus:outline-none focus:border-ink transition-colors placeholder:text-muted-soft"

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-[32px] text-ink" style={{ fontWeight: 300, letterSpacing: '-0.32px' }}>
            Veranstaltungen
          </h2>
          <p className="text-muted text-[13px] mt-0.5 tracking-[0.16px]">
            {hasFilter ? `${filtered.length} von ${sortedEvents.length} geplant` : `${sortedEvents.length} geplant`}
          </p>
        </div>
        <button
          onClick={() => showForm ? closeForm() : setShowForm(true)}
          className={`px-5 py-2.5 rounded-pill text-[15px] font-medium transition-colors ${
            showForm
              ? 'bg-surface border border-hairline-strong text-ink hover:bg-canvas'
              : 'bg-ink-warm hover:bg-ink text-white'
          }`}
        >
          {showForm ? 'Abbrechen' : '+ Neu'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-surface border border-hairline rounded-xl p-6 mb-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-4">
          <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted">
            {editingId ? 'Veranstaltung bearbeiten' : 'Neue Veranstaltung'}
          </p>

          {createMutation.error && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-[#dc2626] text-[13px]">
              {(createMutation.error as Error).message}
            </div>
          )}

          <input
            type="text"
            placeholder="Titel"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={inputClass}
          />

          <textarea
            placeholder="Beschreibung (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className={`${inputClass} resize-none`}
          />

          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[13px] font-medium text-body mb-1.5">Start</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[13px] font-medium text-body mb-1.5">Ende</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-body mb-2">
              Zielrollen <span className="text-muted font-normal">(leer = alle)</span>
            </label>
            <div className="flex gap-4">
              {ALL_ROLES.map(role => (
                <label key={role} className="flex items-center gap-1.5 text-[14px] text-body cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="rounded"
                  />
                  {ROLE_LABELS[role]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-body mb-1.5">
              Ort <span className="text-muted font-normal">(optional)</span>
            </label>
            <LocationPicker key={editingId ?? 'new'} value={eventLocation} onChange={setEventLocation} />
            <p className="text-[12px] text-muted mt-1.5">Der ausgewählte Punkt wird in der App beim Öffnen der Veranstaltung auf einer Karte angezeigt.</p>
          </div>

          <fieldset>
            <legend className="block text-[13px] font-medium text-body mb-2">Sichtbar für</legend>
            <div className="inline-flex rounded-lg border border-hairline-strong bg-canvas p-1">
              {([['all', 'Alle Gruppen'], ['groups', 'Einzelne Gruppen']] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTargetAudience(value)}
                  className={`rounded-md px-4 py-2 text-[14px] font-medium transition-colors ${targetAudience === value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {targetAudience === 'groups' && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {groups.map(group => (
                  <label key={group.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-hairline px-3 py-2.5 text-[14px] text-body hover:bg-canvas-soft">
                    <input
                      type="checkbox"
                      checked={targetGroupIds.includes(group.id)}
                      onChange={() => toggleGroup(group.id)}
                      className="rounded"
                    />
                    {group.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <button
            onClick={() => createMutation.mutate()}
            disabled={title.trim().length < 2 || !startDate || !endDate || (targetAudience === 'groups' && targetGroupIds.length === 0) || createMutation.isPending}
            className="bg-ink-warm hover:bg-ink disabled:opacity-40 text-white text-[15px] font-medium px-5 py-2.5 rounded-pill transition-colors"
          >
            {createMutation.isPending ? 'Speichern…' : editingId ? 'Änderungen speichern' : 'Speichern'}
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex gap-3 flex-wrap mb-4">
        <input
          type="text"
          placeholder="Titel suchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] bg-surface text-ink rounded-lg px-3 py-2.5 border border-hairline-strong text-[14px] focus:outline-none focus:border-ink transition-colors placeholder:text-muted-soft"
        />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="bg-surface text-ink rounded-lg px-3 py-2.5 border border-hairline-strong text-[14px] focus:outline-none focus:border-ink transition-colors"
        >
          <option value="">Alle Rollen</option>
          {ALL_ROLES.map(r => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
        <select
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
          className="bg-surface text-ink rounded-lg px-3 py-2.5 border border-hairline-strong text-[14px] focus:outline-none focus:border-ink transition-colors"
        >
          <option value="">Alle Gruppen</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        {hasFilter && (
          <button
            onClick={() => { setSearch(''); setFilterRole(''); setFilterGroup('') }}
            className="text-[13px] text-muted hover:text-ink transition-colors px-3 py-2.5 rounded-lg border border-hairline-strong hover:bg-canvas"
          >
            Zurücksetzen
          </button>
        )}
      </div>

      {isLoading && <p className="text-muted text-[15px]">Lade…</p>}

      {/* Events list */}
      <div className="space-y-2">
        {filtered.length === 0 && !isLoading && (
          <p className="text-muted text-[15px]">{hasFilter ? 'Keine Treffer.' : 'Noch keine Veranstaltungen.'}</p>
        )}
        {filtered.map(ev => {
          const roles: string[] = (() => {
            try { return JSON.parse(ev.targetRoles) } catch { return [] }
          })()
          const eventGroupIds: string[] = (() => {
            try { return JSON.parse(ev.targetGroupIds) } catch { return ev.groupId ? [ev.groupId] : [] }
          })()
          return (
            <div key={ev.id} className="bg-surface border border-hairline rounded-xl px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-ink font-medium text-[15px]">{ev.title}</p>
                  {ev.description && (
                    <p className="text-body text-[14px] mt-0.5">{ev.description}</p>
                  )}
                  <p className="text-muted text-[13px] mt-1.5">
                    {formatDate(ev.startDate)} – {formatDate(ev.endDate)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {roles.length > 0 ? (
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {roles.map((r: string) => (
                        <span key={r} className="text-[11px] bg-surface-strong text-ink-warm font-semibold tracking-[0.6px] uppercase px-2.5 py-0.5 rounded-pill">
                          {ROLE_LABELS[r] ?? r}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] bg-surface-strong text-muted font-semibold tracking-[0.6px] uppercase px-2.5 py-0.5 rounded-pill">
                      Alle
                    </span>
                  )}
                  {eventGroupIds.length > 0 && (
                    <span className="text-[13px] text-muted">
                      {eventGroupIds.map(id => groups.find(g => g.id === id)?.name ?? id).join(', ')}
                    </span>
                  )}
                  {ev.locationId && (
                    <span className="text-[13px] text-muted">
                      📍 {locations.find(location => location.id === ev.locationId)?.name ?? 'Ort'}
                    </span>
                  )}
                  {(appUser?.role === 'admin' || appUser?.role === 'miniteam' || ev.createdBy === appUser?.uid || (appUser?.role === 'leader' && ev.groupId !== null && ev.groupId === appUser?.groupId)) && (
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => startEdit(ev)}
                        className="text-[13px] text-muted hover:text-ink px-2.5 py-1.5 rounded-lg hover:bg-canvas"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => removeEvent(ev.id, ev.title)}
                        disabled={deleteMutation.isPending}
                        className="text-[13px] text-muted hover:text-[#dc2626] px-2.5 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
