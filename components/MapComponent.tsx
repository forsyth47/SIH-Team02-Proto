'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Utility function to open location in external maps
const openInExternalMap = (lat: number, lng: number) => {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  if (isMobile) {
    if (isIOS) {
      // iOS - opens in Apple Maps
      window.open(`maps://maps.apple.com/?q=${lat},${lng}`, '_blank')
    } else {
      // Android - opens in Google Maps app
      window.open(`geo:${lat},${lng}`, '_blank')
    }
  } else {
    // Desktop - opens Google Maps in browser
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
  }
}

interface MapComponentProps {
  center: [number, number]
  zoom: number
  className?: string
  onLocationSelect?: (lat: number, lng: number) => void
  theme: 'light' | 'dark'
}

export default function MapComponent({
  center,
  zoom,
  className = '',
  onLocationSelect,
  theme
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [currentLocation, setCurrentLocation] = useState<[number, number]>(center)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize the map
    const map = L.map(mapRef.current).setView(center, zoom)

    // Add tile layer based on theme
    const tileLayer = theme === 'dark'
      ? L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
          maxZoom: 20,
        })
      : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 20,
        })

    tileLayer.addTo(map)

    // Add click handler for location selection
    if (onLocationSelect) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        onLocationSelect(lat, lng)
        setCurrentLocation([lat, lng])

        // Remove existing marker
        if (markerRef.current) {
          map.removeLayer(markerRef.current)
        }

        // Add new marker
        markerRef.current = L.marker([lat, lng]).addTo(map)
      })
    }

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update map center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom)
      setCurrentLocation(center)

      // Remove existing marker
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current)
      }

      // Add marker at new center
      markerRef.current = L.marker(center).addTo(mapInstanceRef.current)
    }
  }, [center, zoom])

  // Update tile layer when theme changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      // Remove all tile layers
      mapInstanceRef.current.eachLayer((layer: L.Layer) => {
        if (layer instanceof L.TileLayer) {
          mapInstanceRef.current!.removeLayer(layer)
        }
      })

      // Add new tile layer based on theme
      const tileLayer = theme === 'dark'
        ? L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
            maxZoom: 20,
          })
        : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 20,
          })

      tileLayer.addTo(mapInstanceRef.current)
    }
  }, [theme])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: '200px' }}
      />

      {/* External Maps Button */}
      <button
        onClick={() => openInExternalMap(currentLocation[0], currentLocation[1])}
        className="absolute top-3 right-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg p-2 shadow-lg border border-gray-200 dark:border-gray-600 z-[1000]"
        title="Open in external maps"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}
