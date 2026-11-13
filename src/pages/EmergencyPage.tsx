import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchEmergencyReports, updateEmergencyStatus } from '../api/emergency'
import { StatusBadge } from '../components/StatusBadge'
import type { EmergencyStatus } from '../types'

const typeLabel: Record<string, string> = {
  emergency: 'Notfall',
  lost: 'Vermisst',
  unwell: 'Unwohl',
}

const typeIcon: Record<string, string> = {
  emergency: '⚡',
  lost: '◎',
  unwell: '○',
}

function formatReportTimestamp(timestamp: number): string {
  const milliseconds = timestamp < 1_000_000_000_000
    ? timestamp * 1000
    : timestamp
  return new Date(milliseconds).toLocaleString('de-DE')
}

export function EmergencyPage() {
  const queryClient = useQueryClient()

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['emergency'],
    queryFn: fetchEmergencyReports,
    refetchInterval: 15_000,
  })

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EmergencyStatus }) =>
      updateEmergencyStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emergency'] }),
  })

  const active = reports.filter(r => r.status !== 'resolved')
  const resolved = reports.filter(r => r.status === 'resolved')

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-[32px] text-ink" style={{ fontWeight: 300, letterSpacing: '-0.32px' }}>
            Notfalldashboard
          </h2>
          <p className="text-muted text-[13px] mt-0.5 tracking-[0.16px]">
            Aktualisiert alle 15 s
          </p>
        </div>
        {active.length > 0 && (
          <span className="bg-red-50 text-[#dc2626] text-[11px] font-semibold tracking-[0.8px] uppercase px-3 py-1 rounded-pill">
            {active.length} offen
          </span>
        )}
      </div>

      {isLoading && <p className="text-muted text-[15px]">Lade…</p>}

      {/* No active */}
      {active.length === 0 && !isLoading && (
        <div className="bg-[#f0faf4] border border-[#bbf7d0] rounded-xl px-6 py-5 text-[#16a34a] text-[15px] mb-6 flex items-center gap-3">
          <span className="text-lg">✓</span>
          Keine offenen Notfälle
        </div>
      )}

      {/* Active reports */}
      {active.length > 0 && (
        <section className="mb-8">
          <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted mb-3">
            Aktiv ({active.length})
          </p>
          <div className="space-y-3">
            {active.map(r => (
              <div
                key={r.id}
                className="bg-surface border border-hairline rounded-xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[13px]">{typeIcon[r.type] ?? '○'}</span>
                      <span className="text-ink font-medium text-[15px]">
                        {typeLabel[r.type] ?? r.type}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-body text-[15px]">{r.reporterName}</p>
                    {r.reporterPhone && (
                      <a
                        href={`tel:${r.reporterPhone}`}
                        className="text-ink-warm text-[14px] hover:underline underline-offset-2"
                      >
                        {r.reporterPhone}
                      </a>
                    )}
                    {(r.groupName || r.groupLeaders.length > 0) && (
                      <div className="mt-4 rounded-xl border border-hairline bg-[#fafaf9] px-3.5 py-3">
                        {r.groupName && (
                          <div className="flex items-baseline gap-2 text-[13px]">
                            <span className="w-28 shrink-0 text-muted">Gruppe</span>
                            <span className="font-medium text-ink">{r.groupName}</span>
                          </div>
                        )}
                        {r.groupLeaders.map((leader, index) => (
                          <div
                            key={`${leader.name}-${leader.phone ?? index}`}
                            className={`flex items-start gap-2 text-[13px] ${r.groupName || index > 0 ? 'mt-2' : ''}`}
                          >
                            <span className="w-28 shrink-0 text-muted">
                              {index === 0 ? 'Gruppenleitung' : ''}
                            </span>
                            <span className="min-w-0">
                              <span className="font-medium text-ink">{leader.name}</span>
                              {leader.phone ? (
                                <a
                                  href={`tel:${leader.phone}`}
                                  className="ml-2 whitespace-nowrap text-ink-warm hover:underline underline-offset-2"
                                >
                                  {leader.phone}
                                </a>
                              ) : (
                                <span className="ml-2 text-muted">Keine Telefonnummer</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {r.lat != null && r.lng != null ? (
                      <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-white">
                        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
                          <span className="text-muted text-[12px] tabular-nums">
                            {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
                          </span>
                          <div className="flex gap-3">
                            <a
                              href={`https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}#map=16/${r.lat}/${r.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-ink-warm text-[13px] font-medium hover:underline underline-offset-2"
                            >
                              OpenStreetMap öffnen ↗
                            </a>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-ink-warm text-[13px] font-medium hover:underline underline-offset-2"
                            >
                              Google Maps öffnen ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 rounded-lg bg-[#f5f5f4] px-3 py-2 text-muted text-[12px]">
                        Kein Standort vom Gerät übertragen
                      </p>
                    )}
                    <p className="text-muted text-[13px] mt-2">
                      {formatReportTimestamp(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {r.status === 'open' && (
                      <button
                        onClick={() => mutation.mutate({ id: r.id, status: 'in_progress' })}
                        className="bg-[#fdf6e8] hover:bg-[#fcecd0] text-[#8a5a00] border border-[#f4c5a8] text-[13px] font-medium px-4 py-2 rounded-pill transition-colors"
                      >
                        Übernehmen
                      </button>
                    )}
                    {r.status !== 'resolved' && (
                      <button
                        onClick={() => mutation.mutate({ id: r.id, status: 'resolved' })}
                        className="bg-[#f0faf4] hover:bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0] text-[13px] font-medium px-4 py-2 rounded-pill transition-colors"
                      >
                        Erledigt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <section>
          <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted mb-3">
            Erledigt ({resolved.length})
          </p>
          <div className="space-y-1.5 opacity-50">
            {resolved.map(r => (
              <div
                key={r.id}
                className="bg-surface border border-hairline rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <span className="text-body text-[14px]">
                  {typeIcon[r.type]} {typeLabel[r.type]} — {r.reporterName}
                </span>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
