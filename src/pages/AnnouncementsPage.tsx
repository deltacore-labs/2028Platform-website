import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAnnouncements, createAnnouncement, deleteAnnouncement, archiveAnnouncement, unarchiveAnnouncement } from '../api/announcements'
import { fetchGroups } from '../api/groups'
import { useAuth } from '../context/AuthContext'
import type { Announcement, AnnouncementPriority } from '../types'

const priorityAccent: Record<AnnouncementPriority, string> = {
  info: 'border-l-2 border-[#a8c8e8]',
  important: 'border-l-2 border-[#f4c5a8]',
  critical: 'border-l-2 border-[#dc2626]',
}

const priorityBadge: Record<AnnouncementPriority, string> = {
  info: 'bg-surface-strong text-ink-warm',
  important: 'bg-[#fdf0e8] text-[#8a4a1a]',
  critical: 'bg-red-50 text-[#dc2626]',
}

const priorityLabel: Record<AnnouncementPriority, string> = {
  info: 'Info',
  important: 'Wichtig',
  critical: 'Kritisch',
}

export function AnnouncementsPage() {
  const { appUser } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<AnnouncementPriority>('info')
  const [targetGroupIds, setTargetGroupIds] = useState<string[]>([])
  const [filterPriority, setFilterPriority] = useState<AnnouncementPriority | ''>('')
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const canManage = appUser?.role === 'leader' || appUser?.role === 'miniteam' || appUser?.role === 'admin'

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements', showArchived],
    queryFn: () => fetchAnnouncements(showArchived),
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    enabled: appUser?.role === 'miniteam',
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createAnnouncement({ text, priority, targetGroupIds, targetRoles: [] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      setText('')
      setPriority('info')
      setTargetGroupIds([])
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  })

  const archiveMutation = useMutation({
    mutationFn: (a: Announcement) =>
      a.archivedAt ? unarchiveAnnouncement(a.id) : archiveAnnouncement(a.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  })

  function canManageItem(a: Announcement): boolean {
    if (!appUser || !canManage) return false
    if (appUser.role === 'leader') return a.createdBy === appUser.uid
    return true
  }

  function handleDelete(a: Announcement) {
    if (!confirm(`Durchsage wirklich löschen?\n\n"${a.text.slice(0, 80)}"`)) return
    deleteMutation.mutate(a.id)
  }

  const filtered = announcements.filter(a => {
    if (filterPriority && a.priority !== filterPriority) return false
    if (search && !a.text.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const hasFilter = filterPriority || search

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-[32px] text-ink" style={{ fontWeight: 300, letterSpacing: '-0.32px' }}>
            Ankündigungen
          </h2>
          <p className="text-muted text-[13px] mt-0.5 tracking-[0.16px]">
            {hasFilter ? `${filtered.length} von ${announcements.length} gesamt` : `${announcements.length} gesamt`}
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
        <div className="bg-surface border border-hairline rounded-xl p-6 mb-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted mb-4">
            Neue Ankündigung
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-body mb-1.5">Text</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={3}
                className="w-full bg-surface text-ink rounded-lg px-4 py-3 border border-hairline-strong text-[15px] focus:outline-none focus:border-ink transition-colors resize-none placeholder:text-muted-soft"
                placeholder="Ankündigungstext…"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-body mb-1.5">Priorität</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as AnnouncementPriority)}
                className="bg-surface text-ink rounded-lg px-4 py-3 border border-hairline-strong text-[15px] focus:outline-none focus:border-ink transition-colors"
              >
                <option value="info">Info</option>
                <option value="important">Wichtig</option>
                <option value="critical">Kritisch</option>
              </select>
            </div>

            {appUser?.role === 'miniteam' && groups.length > 0 && (
              <div>
                <label className="block text-[13px] font-medium text-body mb-2">
                  Zielgruppen <span className="text-muted font-normal">(leer = alle)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {groups.map(g => (
                    <label key={g.id} className="flex items-center gap-1.5 text-[14px] text-body cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targetGroupIds.includes(g.id)}
                        onChange={e =>
                          setTargetGroupIds(prev =>
                            e.target.checked ? [...prev, g.id] : prev.filter(id => id !== g.id)
                          )
                        }
                        className="rounded"
                      />
                      {g.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => createMutation.mutate()}
              disabled={!text.trim() || createMutation.isPending}
              className="bg-ink-warm hover:bg-ink disabled:opacity-40 text-white text-[15px] font-medium px-5 py-2.5 rounded-pill transition-colors"
            >
              {createMutation.isPending ? 'Senden…' : 'Senden'}
            </button>
          </div>
        </div>
      )}

      {/* Filter + archive toggle bar */}
      <div className="flex gap-3 flex-wrap mb-4 items-center">
        <input
          type="text"
          placeholder="Text suchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] bg-surface text-ink rounded-lg px-3 py-2.5 border border-hairline-strong text-[14px] focus:outline-none focus:border-ink transition-colors placeholder:text-muted-soft"
        />
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value as AnnouncementPriority | '')}
          className="bg-surface text-ink rounded-lg px-3 py-2.5 border border-hairline-strong text-[14px] focus:outline-none focus:border-ink transition-colors"
        >
          <option value="">Alle Prioritäten</option>
          <option value="info">Info</option>
          <option value="important">Wichtig</option>
          <option value="critical">Kritisch</option>
        </select>
        {canManage && (
          <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              className="rounded"
            />
            Archiv
          </label>
        )}
        {hasFilter && (
          <button
            onClick={() => { setSearch(''); setFilterPriority('') }}
            className="text-[13px] text-muted hover:text-ink transition-colors px-3 py-2.5 rounded-lg border border-hairline-strong hover:bg-canvas"
          >
            Zurücksetzen
          </button>
        )}
      </div>

      {isLoading && <p className="text-muted text-[15px]">Lade…</p>}

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && !isLoading && (
          <p className="text-muted text-[15px]">{hasFilter ? 'Keine Treffer.' : 'Noch keine Ankündigungen.'}</p>
        )}
        {filtered.map(a => {
          const isArchived = a.archivedAt !== null
          return (
            <div
              key={a.id}
              className={`bg-surface border border-hairline rounded-xl px-5 py-4 ${isArchived ? 'border-l-2 border-l-gray-300 opacity-50' : priorityAccent[a.priority]}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] font-semibold tracking-[0.8px] uppercase px-2 py-0.5 rounded-pill ${isArchived ? 'bg-gray-100 text-gray-500' : priorityBadge[a.priority]}`}>
                      {priorityLabel[a.priority]}
                    </span>
                    <span className="text-muted text-[13px]">
                      {new Date(a.createdAt).toLocaleString('de-DE')}
                    </span>
                    {isArchived && (
                      <span className="text-[11px] text-gray-400 border border-gray-300 rounded px-1.5 py-0.5 font-medium">
                        Archiviert
                      </span>
                    )}
                  </div>
                  <p className={`text-[15px] leading-relaxed ${isArchived ? 'text-muted line-through' : 'text-ink'}`}>
                    {a.text}
                  </p>
                </div>
                {canManageItem(a) && (
                  <div className="flex gap-1 shrink-0 ml-2 mt-0.5">
                    <button
                      onClick={() => archiveMutation.mutate(a)}
                      disabled={archiveMutation.isPending}
                      title={isArchived ? 'Wiederherstellen' : 'Archivieren'}
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-canvas transition-colors disabled:opacity-40"
                    >
                      {isArchived ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(a)}
                      disabled={deleteMutation.isPending}
                      title="Löschen"
                      className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
