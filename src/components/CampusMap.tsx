import { useEffect, useRef } from 'react'
import { Lot, occupancyPct, occupancyColor, occupancyLabel } from '../lib/supabase'

interface Props {
  lots: Lot[]
  selectedLotId: string | null
  onSelectLot: (id: string) => void
}

// Leaflet must be loaded client-side only (no SSR)
export default function CampusMap({ lots, selectedLotId, onSelectLot }: Props) {
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})
  const containerId = 'campus-map-container'

  useEffect(() => {
    // Dynamically import leaflet to avoid SSR issues
    import('leaflet').then(L => {
      if (mapRef.current) return // Already initialized

      // Fix default icon paths in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // UMBC campus center
      const map = L.map(containerId, {
        center: [39.2548, -76.7150],
        zoom: 16,
        zoomControl: true,
      })

      // OpenStreetMap tiles (free, no API key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      addMarkers(L, map, lots)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markersRef.current = {}
      }
    }
  }, [])

  // Update markers when lots data changes (real-time updates)
  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => updateMarkers(L))
  }, [lots])

  // Pan to selected lot
  useEffect(() => {
    if (!mapRef.current || !selectedLotId) return
    const lot = lots.find(l => l.id === selectedLotId)
    if (lot) mapRef.current.flyTo([lot.lat, lot.lng], 17, { duration: 0.8 })
  }, [selectedLotId])

  function addMarkers(L: any, map: any, lotsData: Lot[]) {
    lotsData.forEach(lot => {
      const marker = createMarker(L, lot)
      marker.addTo(map)
      marker.on('click', () => onSelectLot(lot.id))
      markersRef.current[lot.id] = marker
    })
  }

  function updateMarkers(L: any) {
    lots.forEach(lot => {
      const existing = markersRef.current[lot.id]
      if (existing) {
        existing.setIcon(createIcon(L, lot))
        existing.setPopupContent(popupContent(lot))
      } else {
        const marker = createMarker(L, lot)
        marker.addTo(mapRef.current)
        marker.on('click', () => onSelectLot(lot.id))
        markersRef.current[lot.id] = marker
      }
    })
  }

  function createMarker(L: any, lot: Lot) {
    const marker = L.marker([lot.lat, lot.lng], { icon: createIcon(L, lot) })
    marker.bindPopup(popupContent(lot), { maxWidth: 220 })
    return marker
  }

  function createIcon(L: any, lot: Lot) {
    const pct = occupancyPct(lot)
    const color = occupancyColor(pct)
    const label = occupancyLabel(pct)
    return L.divIcon({
      className: '',
      html: `
        <div style="
          background: ${color};
          color: white;
          border: 2px solid white;
          border-radius: 10px;
          padding: 6px 10px;
          font-family: Syne, sans-serif;
          font-weight: 700;
          font-size: 12px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          cursor: pointer;
          min-width: 70px;
          text-align: center;
        ">
          ${lot.short_name}<br>
          <span style="font-size: 11px; opacity: 0.9;">${pct}% · ${label}</span>
        </div>
      `,
      iconAnchor: [40, 20],
    })
  }

  function popupContent(lot: Lot) {
    const pct = occupancyPct(lot)
    const color = occupancyColor(pct)
    return `
      <div style="font-family: DM Sans, sans-serif; min-width: 180px;">
        <div style="font-family: Syne, sans-serif; font-weight: 700; font-size: 15px; margin-bottom: 6px;">
          ${lot.name}
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <div style="flex:1; background:#F0EEE8; border-radius:4px; height:8px; overflow:hidden;">
            <div style="width:${pct}%; height:8px; background:${color}; border-radius:4px;"></div>
          </div>
          <span style="font-weight:700; color:${color}; font-size:13px;">${pct}%</span>
        </div>
        <div style="font-size:12px; color:#666;">
          Permits: ${lot.permits.join(', ')} &nbsp;·&nbsp; Capacity: ${lot.capacity}
        </div>
      </div>
    `
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        id={containerId}
        style={{ width: '100%', height: '100%', minHeight: 400 }}
      />
    </>
  )
}
