import { useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchAuditLog } from '../api/audit-log'
import type { AuditLogEntry } from '../types'

const actionLabels: Record<string, string> = {
  'announcement.sent': 'hat eine Ankündigung gesendet',
  'announcement.status_changed': 'hat den Archivstatus einer Ankündigung geändert',
  'announcement.deleted': 'hat eine Ankündigung gelöscht',
  'event.created': 'hat eine Veranstaltung erstellt',
  'event.updated': 'hat eine Veranstaltung geändert',
  'event.deleted': 'hat eine Veranstaltung gelöscht',
  'location.created': 'hat einen Ort erstellt',
  'location.updated': 'hat einen Ort geändert',
  'location.deleted': 'hat einen Ort gelöscht',
  'group.created': 'hat eine Gruppe erstellt',
  'group.updated': 'hat eine Gruppe geändert',
  'group.deleted': 'hat eine Gruppe gelöscht',
  'group.primary_leader_changed': 'hat die Hauptgruppenleitung geändert',
  'group.leader_changed': 'hat eine Gruppenleitung geändert',
  'group.join_request_resolved': 'hat eine Beitrittsanfrage bearbeitet',
  'diocese.created': 'hat ein Bistum erstellt',
  'diocese.updated': 'hat ein Bistum geändert',
  'diocese.deleted': 'hat ein Bistum gelöscht',
  'diocese.reordered': 'hat die Reihenfolge der Bistümer geändert',
  'user.created': 'hat eine Person angelegt',
  'user.updated': 'hat eine Person geändert',
  'user.password_reset_sent': 'hat eine Passwort-Zurücksetzung versendet',
  'user.deleted': 'hat eine Person gelöscht',
  'emergency.created': 'hat eine Meldung abgeschickt',
  'emergency.status_changed': 'hat den Status einer Meldung geändert',
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  miniteam: 'Mini-Team',
  leader: 'Gruppenleitung',
  malteser: 'Malteser',
  participant: 'Teilnehmer/in',
  guest: 'Gast',
}

const categories = [
  { value: '', label: 'Alles' },
  { value: 'announcement', label: 'Ankündigungen' },
  { value: 'event', label: 'Veranstaltungen' },
  { value: 'user', label: 'Personen' },
  { value: 'group', label: 'Gruppen' },
  { value: 'diocese', label: 'Bistümer' },
  { value: 'emergency', label: 'Meldungen' },
]

const detailLabels: Record<string, string> = {
  action: 'Entscheidung',
  assignment: 'Zuordnung',
  blocked: 'Gesperrt',
  diocese_id: 'Bistum',
  group_id: 'Gruppe',
  name: 'Name',
  priority: 'Priorität',
  role: 'Rolle',
  status: 'Status',
  title: 'Titel',
  type: 'Typ',
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || '?'
}

function formatDetail(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein'
  if (Array.isArray(value)) return value.filter(item => typeof item === 'string').join(', ') || null
  return null
}

function AuditEntry({ entry }: { entry: AuditLogEntry }) {
  const details = Object.entries(entry.details)
    .filter(([key]) => key !== 'text' && detailLabels[key])
    .map(([key, value]) => ({ label: detailLabels[key], value: formatDetail(value) }))
    .filter((detail): detail is { label: string; value: string } => detail.value !== null)

  return (
    <article className="relative flex gap-3 rounded-xl border border-hairline bg-surface px-4 py-4 shadow-[0_1px_2px_rgba(12,10,9,0.025)] sm:gap-4 sm:px-5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-strong text-[12px] font-semibold text-ink">
        {initials(entry.actorName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[14px] leading-5">
          <span className="font-semibold text-ink">{entry.actorName}</span>
          <span className="text-body">{actionLabels[entry.action] ?? 'hat etwas geändert'}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
          <span className="rounded-full bg-canvas px-2 py-0.5 font-medium">{roleLabels[entry.actorRole] ?? entry.actorRole}</span>
          <time dateTime={new Date(entry.createdAt * 1_000).toISOString()}>
            {new Date(entry.createdAt * 1_000).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}
          </time>
        </div>
        {entry.summary && (
          <p className="mt-3 whitespace-pre-wrap break-words rounded-lg border border-hairline bg-canvas-soft px-3 py-2.5 text-[13px] leading-5 text-ink">
            {entry.summary}
          </p>
        )}
        {details.length > 0 && (
          <dl className="mt-3 flex flex-wrap gap-2">
            {details.map(detail => (
              <div key={`${detail.label}-${detail.value}`} className="flex max-w-full gap-1 rounded-md bg-canvas px-2 py-1 text-[11px]">
                <dt className="text-muted">{detail.label}:</dt>
                <dd className="truncate font-medium text-body">{detail.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  )
}

export function AuditLogPage() {
  const [entityType, setEntityType] = useState('')
  const [search, setSearch] = useState('')
  const query = useInfiniteQuery({
    queryKey: ['audit-log', entityType],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchAuditLog({ cursor: pageParam, entityType }),
    getNextPageParam: page => page.nextCursor ?? undefined,
  })

  const entries = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('de-DE')
    const all = query.data?.pages.flatMap(page => page.entries) ?? []
    if (!needle) return all
    return all.filter(entry => [
      entry.actorName,
      entry.summary,
      actionLabels[entry.action] ?? entry.action,
      JSON.stringify(entry.details),
    ].some(value => value.toLocaleLowerCase('de-DE').includes(needle)))
  }, [query.data, search])

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="mb-7">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Nur für Administratoren</p>
        <h2 className="font-display text-[32px] font-light tracking-[-0.01em] text-ink">Aktivitätsprotokoll</h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-5 text-muted">
          Nachvollziehbare Änderungen und versendete Inhalte – mit Person, Aktion und Zeitpunkt.
        </p>
      </div>

      <div className="mb-5 space-y-3">
        <input
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Person, Inhalt oder Aktion suchen…"
          className="w-full rounded-lg border border-hairline-strong bg-surface px-4 py-3 text-[14px] text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none"
        />
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Protokoll filtern">
          {categories.map(category => (
            <button
              key={category.value}
              type="button"
              onClick={() => setEntityType(category.value)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium ${
                entityType === category.value
                  ? 'border-ink-warm bg-ink-warm text-white'
                  : 'border-hairline-strong bg-surface text-body hover:bg-canvas'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {query.isLoading && <p className="py-8 text-center text-[14px] text-muted">Protokoll wird geladen…</p>}
      {query.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[14px] text-red-700">
          Das Aktivitätsprotokoll konnte nicht geladen werden.
        </div>
      )}
      {!query.isLoading && !query.isError && entries.length === 0 && (
        <div className="rounded-xl border border-dashed border-hairline-strong bg-surface p-8 text-center text-[14px] text-muted">
          {search ? 'Keine passenden Einträge gefunden.' : 'Noch keine Aktivitäten protokolliert.'}
        </div>
      )}
      <div className="space-y-2">
        {entries.map(entry => <AuditEntry key={entry.id} entry={entry} />)}
      </div>
      {query.hasNextPage && !search && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="rounded-full border border-hairline-strong bg-surface px-5 py-2.5 text-[13px] font-medium text-ink hover:bg-canvas disabled:opacity-50"
          >
            {query.isFetchingNextPage ? 'Wird geladen…' : 'Ältere Aktivitäten laden'}
          </button>
        </div>
      )}
    </div>
  )
}
