import { useEffect, useRef, useState, type FormEvent } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type EventLocation = { name: string; lat: number; lng: number }
type SearchResult = EventLocation & { id: string }
type PhotonFeature = {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    osm_id?: number; osm_type?: string; name?: string; street?: string
    housenumber?: string; city?: string; district?: string; country?: string
  }
}

const ROME_CENTER: L.LatLngExpression = [41.9028, 12.4964]
const markerIcon = L.divIcon({
  className: '',
  html: '<span class="event-location-pin" aria-hidden="true"></span>',
  iconAnchor: [16, 32],
  iconSize: [32, 32],
})

function resultName(properties: NonNullable<PhotonFeature['properties']>) {
  const street = [properties.street, properties.housenumber].filter(Boolean).join(' ')
  return [properties.name, street, properties.city ?? properties.district, properties.country]
    .filter((part, index, all) => Boolean(part) && all.indexOf(part) === index)
    .join(', ')
}

export function LocationPicker({ value, onChange }: {
  value: EventLocation | null
  onChange: (value: EventLocation | null) => void
}) {
  const mapElementRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)
  const [query, setQuery] = useState(value?.name ?? '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    valueRef.current = value
  }, [value])

  function attachMarker(map: L.Map, lat: number, lng: number) {
    const marker = L.marker([lat, lng], { draggable: true, icon: markerIcon, title: 'Veranstaltungsort' }).addTo(map)
    marker.on('dragend', () => {
      const point = marker.getLatLng()
      const current = valueRef.current
      if (current) onChangeRef.current({ ...current, lat: point.lat, lng: point.lng })
    })
    markerRef.current = marker
    return marker
  }

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return
    const current = valueRef.current
    const map = L.map(mapElementRef.current, {
      center: current ? [current.lat, current.lng] : ROME_CENTER,
      zoom: current ? 16 : 12,
      scrollWheelZoom: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap-Mitwirkende',
      maxZoom: 19,
    }).addTo(map)
    if (current) attachMarker(map, current.lat, current.lng)
    map.on('click', event => {
      const latest = valueRef.current
      if (!latest) return
      const marker = markerRef.current ?? attachMarker(map, event.latlng.lat, event.latlng.lng)
      marker.setLatLng(event.latlng)
      onChangeRef.current({ ...latest, lat: event.latlng.lat, lng: event.latlng.lng })
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!value || !map) return
    const marker = markerRef.current ?? attachMarker(map, value.lat, value.lng)
    marker.setLatLng([value.lat, value.lng])
  }, [value])

  async function searchLocation(event: FormEvent) {
    event.preventDefault()
    const term = query.trim()
    if (term.length < 2) return
    setIsSearching(true)
    setSearchError('')
    setResults([])
    try {
      const params = new URLSearchParams({ q: term, limit: '6', lang: 'de', lat: '41.9028', lon: '12.4964' })
      const response = await fetch(`https://photon.komoot.io/api/?${params}`)
      if (!response.ok) throw new Error('search failed')
      const data = await response.json() as { features?: PhotonFeature[] }
      const nextResults = (data.features ?? []).flatMap<SearchResult>(feature => {
        const coordinates = feature.geometry?.coordinates
        const properties = feature.properties
        if (!coordinates || !properties) return []
        const name = resultName(properties)
        if (!name) return []
        return [{
          id: `${properties.osm_type ?? 'place'}-${properties.osm_id ?? coordinates.join('-')}`,
          name, lat: coordinates[1], lng: coordinates[0],
        }]
      })
      setResults(nextResults)
      if (nextResults.length === 0) setSearchError('Kein passender Ort gefunden. Versuche einen genaueren Suchbegriff.')
    } catch {
      setSearchError('Die Ortssuche ist gerade nicht erreichbar. Bitte versuche es erneut.')
    } finally {
      setIsSearching(false)
    }
  }

  function selectResult(result: SearchResult) {
    const nextValue = { name: result.name, lat: result.lat, lng: result.lng }
    setQuery(result.name)
    setResults([])
    onChange(nextValue)
    mapRef.current?.setView([result.lat, result.lng], 16)
  }

  function clearLocation() {
    setQuery('')
    setResults([])
    markerRef.current?.remove()
    markerRef.current = null
    onChange(null)
  }

  return (
    <div className="space-y-3">
      <form onSubmit={searchLocation} className="flex gap-2">
        <input type="search" value={query} onChange={event => setQuery(event.target.value)}
          placeholder="Ort oder Adresse suchen…" enterKeyHint="search"
          className="min-w-0 flex-1 bg-surface text-ink rounded-lg px-4 py-3 border border-hairline-strong text-[16px] focus:outline-none focus:border-ink transition-colors placeholder:text-muted-soft" />
        <button type="submit" disabled={query.trim().length < 2 || isSearching}
          className="min-h-12 rounded-lg bg-ink-warm px-4 text-[14px] font-medium text-white active:scale-[0.98] disabled:opacity-40">
          {isSearching ? 'Suche…' : 'Suchen'}
        </button>
      </form>
      {searchError && <p role="alert" className="text-[13px] text-[#dc2626]">{searchError}</p>}
      {results.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-hairline-strong bg-surface" role="list" aria-label="Suchergebnisse">
          {results.map(result => (
            <button key={result.id} type="button" onClick={() => selectResult(result)}
              className="block min-h-12 w-full border-b border-hairline px-4 py-3 text-left text-[14px] text-body last:border-b-0 active:bg-canvas" role="listitem">
              <span className="mr-2" aria-hidden="true">📍</span>{result.name}
            </button>
          ))}
        </div>
      )}
      <div className="relative overflow-hidden rounded-xl border border-hairline-strong">
        <div ref={mapElementRef} className="h-[280px] w-full bg-canvas" aria-label="Karte zur Auswahl des Veranstaltungsorts" />
        {!value && <div className="pointer-events-none absolute inset-x-4 top-4 z-[500] rounded-lg bg-white/95 px-3 py-2 text-center text-[13px] text-body shadow-sm">Suche zuerst nach einem Ort.</div>}
      </div>
      {value && (
        <div className="flex items-start justify-between gap-3 rounded-lg bg-canvas px-3 py-2.5">
          <div><p className="text-[13px] font-medium text-ink">{value.name}</p>
            <p className="mt-0.5 text-[12px] text-muted">Pin ziehen oder auf die Karte tippen, um den Punkt anzupassen.</p></div>
          <button type="button" onClick={clearLocation} className="min-h-11 shrink-0 px-2 text-[13px] text-[#dc2626]">Entfernen</button>
        </div>
      )}
    </div>
  )
}
