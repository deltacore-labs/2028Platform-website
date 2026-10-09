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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Veranstaltungen</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          {showForm ? 'Abbrechen' : '+ Neu'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-red-100 rounded-xl p-5 mb-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Neue Veranstaltung
          </h3>

          {createMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-xs font-mono">
              {(createMutation.error as Error).message}
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Titel"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          <textarea
            placeholder="Beschreibung (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-600 resize-none"
          />

          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">Start</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">Ende</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2">
              Zielgruppe (leer = alle)
            </label>
            <div className="flex gap-3 flex-wrap">
              {ALL_ROLES.map(role => (
                <label key={role} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="accent-red-600"
                  />
                  {ROLE_LABELS[role]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Gruppe (optional)</label>
            <select
              value={targetGroupId}
              onChange={e => setTargetGroupId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
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
            className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-50 hover:bg-red-700 transition-colors"
          >
            {createMutation.isPending ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      )}

      {isLoading && <p className="text-gray-500">Lade…</p>}

      <div className="space-y-3">
        {sortedEvents.length === 0 && !isLoading && (
          <p className="text-gray-400 text-sm">Noch keine Veranstaltungen.</p>
        )}
        {sortedEvents.map(ev => {
          const roles: string[] = (() => {
            try { return JSON.parse(ev.targetRoles) } catch { return [] }
          })()
          return (
            <div key={ev.id} className="bg-white rounded-xl border border-red-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{ev.title}</p>
                  {ev.description && (
                    <p className="text-gray-500 text-sm mt-0.5">{ev.description}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    {formatDate(ev.startDate)} – {formatDate(ev.endDate)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {roles.length > 0 ? (
                    <div className="flex gap-1 flex-wrap justify-end">
                      {roles.map((r: string) => (
                        <span key={r} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                          {ROLE_LABELS[r] ?? r}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      Alle
                    </span>
                  )}
                  {ev.groupId && (
                    <span className="text-xs text-gray-400">
                      Gruppe: {groups.find(g => g.id === ev.groupId)?.name ?? ev.groupId}
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
