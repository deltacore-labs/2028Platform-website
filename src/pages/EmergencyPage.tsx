import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchEmergencyReports, updateEmergencyStatus } from '../api/emergency'
import { StatusBadge } from '../components/StatusBadge'
import type { EmergencyStatus } from '../types'

const typeLabel: Record<string, string> = {
  emergency: '🚨 Notfall',
  lost: '🔍 Vermisst',
  unwell: '🤒 Unwohl',
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Notfalldashboard</h2>
        <span className="text-stone-500 text-sm">Aktualisiert automatisch alle 15 s</span>
      </div>

      {isLoading && <p className="text-stone-400">Lade…</p>}

      {active.length === 0 && !isLoading && (
        <div className="bg-green-950/60 border border-green-900/40 rounded-xl p-6 text-green-400 text-center mb-6">
          ✓ Keine offenen Notfälle
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-8">
          <h3 className="text-stone-400 text-sm font-medium uppercase tracking-wider mb-3">
            Aktiv ({active.length})
          </h3>
          <div className="space-y-3">
            {active.map(r => (
              <div key={r.id} className="bg-stone-900 rounded-xl p-4 border border-stone-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold">{typeLabel[r.type] ?? r.type}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-stone-300 text-sm">{r.reporterName}</p>
                    {r.reporterPhone && (
                      <a href={`tel:${r.reporterPhone}`} className="text-amber-400 text-sm hover:underline">
                        {r.reporterPhone}
                      </a>
                    )}
                    {r.lat && r.lng && (
                      <a
                        href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-amber-400 text-xs mt-1 hover:underline"
                      >
                        Standort anzeigen ↗
                      </a>
                    )}
                    <p className="text-stone-500 text-xs mt-1">
                      {new Date(r.createdAt).toLocaleString('de-DE')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {r.status === 'open' && (
                      <button
                        onClick={() => mutation.mutate({ id: r.id, status: 'in_progress' })}
                        className="bg-amber-700 hover:bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Übernehmen
                      </button>
                    )}
                    {r.status !== 'resolved' && (
                      <button
                        onClick={() => mutation.mutate({ id: r.id, status: 'resolved' })}
                        className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
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

      {resolved.length > 0 && (
        <section>
          <h3 className="text-stone-400 text-sm font-medium uppercase tracking-wider mb-3">
            Erledigt ({resolved.length})
          </h3>
          <div className="space-y-2 opacity-50">
            {resolved.map(r => (
              <div key={r.id} className="bg-stone-950 rounded-xl p-3 flex items-center justify-between border border-stone-900">
                <span className="text-stone-400 text-sm">{typeLabel[r.type]} — {r.reporterName}</span>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
