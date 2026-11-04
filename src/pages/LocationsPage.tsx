import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLocation, deleteLocation, fetchLocations, updateLocation, type LocationInput } from '../api/locations'
import type { AppLocation, LocationType } from '../types'

const TYPE_LABELS: Record<LocationType, string> = {
  venue: 'Veranstaltungsort', water: 'Wasser', medical: 'Medizin',
  shade: 'Schatten', transport: 'Transport', spiritual: 'Spirituell',
}

const emptyForm = { name: '', type: 'venue' as LocationType, lat: '', lng: '', description: '' }

export function LocationsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { data: locations = [], isLoading } = useQuery({ queryKey: ['locations'], queryFn: fetchLocations })

  const payload = (): LocationInput => ({
    name: form.name.trim(), type: form.type, lat: Number(form.lat), lng: Number(form.lng),
    description: form.description.trim() || undefined,
  })
  const saveMutation = useMutation({
    mutationFn: () => editingId ? updateLocation(editingId, payload()) : createLocation(payload()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      setForm(emptyForm)
      setEditingId(null)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  })

  function edit(location: AppLocation) {
    setEditingId(location.id)
    setForm({
      name: location.name, type: location.type, lat: String(location.lat), lng: String(location.lng),
      description: location.description ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const valid = form.name.trim().length >= 2 && Number.isFinite(Number(form.lat)) && Number.isFinite(Number(form.lng))
    && Number(form.lat) >= -90 && Number(form.lat) <= 90 && Number(form.lng) >= -180 && Number(form.lng) <= 180

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h2 className="font-display text-[32px] text-ink" style={{ fontWeight: 300 }}>Orte</h2>
        <p className="text-muted text-[13px] mt-0.5">Orte für Veranstaltungen und Kartenansicht</p>
      </div>
      <div className="bg-surface border border-hairline rounded-xl p-5 mb-6 space-y-4">
        <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted">
          {editingId ? 'Ort bearbeiten' : 'Neuer Ort'}
        </p>
        {saveMutation.error && <p className="text-[#dc2626] text-[13px]">{(saveMutation.error as Error).message}</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="bg-surface rounded-lg px-4 py-3 border border-hairline-strong" />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as LocationType })} className="bg-surface rounded-lg px-4 py-3 border border-hairline-strong">
            {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input type="number" inputMode="decimal" step="any" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} placeholder="Breitengrad, z. B. 41.9028" className="bg-surface rounded-lg px-4 py-3 border border-hairline-strong" />
          <input type="number" inputMode="decimal" step="any" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} placeholder="Längengrad, z. B. 12.4964" className="bg-surface rounded-lg px-4 py-3 border border-hairline-strong" />
        </div>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Beschreibung (optional)" rows={2} className="w-full bg-surface rounded-lg px-4 py-3 border border-hairline-strong resize-none" />
        <div className="flex gap-2">
          <button onClick={() => saveMutation.mutate()} disabled={!valid || saveMutation.isPending} className="bg-ink-warm text-white px-5 py-2.5 rounded-pill disabled:opacity-40">
            {saveMutation.isPending ? 'Speichern…' : 'Speichern'}
          </button>
          {editingId && <button onClick={() => { setEditingId(null); setForm(emptyForm) }} className="px-4 py-2 text-muted">Abbrechen</button>}
        </div>
      </div>
      {isLoading && <p className="text-muted">Lade…</p>}
      <div className="space-y-2">
        {locations.map(location => (
          <div key={location.id} className="bg-surface border border-hairline rounded-xl px-5 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-ink">{location.name}</p>
              <p className="text-[13px] text-muted mt-1">{TYPE_LABELS[location.type]} · {location.lat}, {location.lng}</p>
              {location.description && <p className="text-[13px] text-body mt-1">{location.description}</p>}
              <a href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`} target="_blank" rel="noreferrer" className="inline-block text-[13px] text-ink-warm mt-2 hover:underline">Auf Karte prüfen ↗</a>
            </div>
            <div className="flex gap-1">
              <button onClick={() => edit(location)} className="text-[13px] text-muted px-2.5 py-1.5">Bearbeiten</button>
              <button onClick={() => confirm(`Ort „${location.name}“ löschen?`) && deleteMutation.mutate(location.id)} className="text-[13px] text-[#dc2626] px-2.5 py-1.5">Löschen</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
