import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchEvents, createEvent } from '../api/events'
import { fetchGroups } from '../api/groups'
import type { UserRole } from '../types'

const ROLE_LABELS: Record<string, string> = {
  participant: 'Teilnehmer',
  leader: 'Leiter',
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

export function EventsPage() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(defaultDatetime())
  const [endDate, setEndDate] = useState(defaultDatetime(1))
  const [targetRoles, setTargetRoles] = useState<UserRole[]>([])
  const [targetGroupId, setTargetGroupId] = useState('')
  const [showForm, setShowForm] = useState(false)

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

  const createMutation = useMutation({
    mutationFn: () =>
      createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        start_date: toUnix(startDate),
        end_date: toUnix(endDate),
        target_roles: targetRoles.length > 0 ? targetRoles : undefined,
        group_id: targetGroupId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setTitle('')
      setDescription('')
      setStartDate(defaultDatetime())
      setEndDate(defaultDatetime(1))
      setTargetRoles([])
      setTargetGroupId('')
      setShowForm(false)
    },
  })

  function toggleRole(role: UserRole) {
    setTargetRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role],
    )
  }

  const sortedEvents = [...events].sort((a, b) => a.startDate - b.startDate)

  const filtered = sortedEvents.filter(ev => {
    if (search && !ev.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterGroup && ev.groupId !== filterGroup) return false
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
          onClick={() => setShowForm(v => !v)}
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
            Neue Veranstaltung
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
              Gruppe <span className="text-muted font-normal">(optional)</span>
            </label>
            <select
              value={targetGroupId}
              onChange={e => setTargetGroupId(e.target.value)}
              className="bg-surface text-ink rounded-lg px-4 py-3 border border-hairline-strong text-[15px] focus:outline-none focus:border-ink transition-colors"
            >
              <option value="">Alle Gruppen</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => createMutation.mutate()}
            disabled={title.trim().length < 2 || !startDate || !endDate || createMutation.isPending}
            className="bg-ink-warm hover:bg-ink disabled:opacity-40 text-white text-[15px] font-medium px-5 py-2.5 rounded-pill transition-colors"
          >
            {createMutation.isPending ? 'Speichern…' : 'Speichern'}
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
                  {ev.groupId && (
                    <span className="text-[13px] text-muted">
                      {groups.find(g => g.id === ev.groupId)?.name ?? ev.groupId}
                    </span>
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
