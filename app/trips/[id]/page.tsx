'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import MapComponent to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('../../../components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-300 flex items-center justify-center rounded-2xl">
      <span className="text-gray-600">Loading Map...</span>
    </div>
  )
})

interface TripData {
  id: string
  tripNumber: string
  origin: string
  destination: string
  modeOfTransport: string
  departure: string
  arrival: string
  travelers: Array<{ id: string; name: string }>
  notes: string
  locationCoords?: {
    lat: number
    lng: number
  }
  weatherData?: {
    temperature: number
    temperatureUnit: string
    windSpeed: number
    windSpeedUnit: string
    time: string
  }
  createdAt: string
}

export default function TripDetail() {
  const router = useRouter()
  const params = useParams()
  const tripId = params.id as string

  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [trip, setTrip] = useState<TripData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194])

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      setTheme('light') // Default to light theme
    }
  }, [])

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode')
    } else {
      document.body.classList.remove('light-mode')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  // Set initial theme on body load
  useEffect(() => {
    document.body.classList.add('light-mode') // Start with light mode
  }, [])

  useEffect(() => {
    if (tripId) {
      fetchTrip()
    }
  }, [tripId])

  const fetchTrip = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/trips')
      if (response.ok) {
        const trips = await response.json()
        const foundTrip = trips.find((t: TripData) => t.id === tripId)
        if (foundTrip) {
          setTrip(foundTrip)
          if (foundTrip.locationCoords) {
            setMapCenter([foundTrip.locationCoords.lat, foundTrip.locationCoords.lng])
          }
        } else {
          setError('Trip not found')
        }
      } else {
        throw new Error('Failed to fetch trip')
      }
    } catch (error) {
      console.error('Error fetching trip:', error)
      setError('Failed to load trip details')
    } finally {
      setLoading(false)
    }
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getModeIcon = (mode: string) => {
    const modeMap: { [key: string]: string } = {
      'Car': 'fa-car',
      'Bike': 'fa-person-biking',
      'Train': 'fa-train',
      'Cycle': 'fa-bicycle',
      'Walk': 'fa-person-walking',
      'Other': 'fa-ellipsis-h'
    }
    return modeMap[mode] || 'fa-ellipsis-h'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card rounded-3xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-secondary">Loading trip details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold mb-2">Trip Not Found</h3>
          <p className="text-secondary mb-6">{error || 'The requested trip could not be found.'}</p>
          <button
            onClick={() => router.push('/')}
            className="accent-bg text-white px-6 py-2 rounded-xl hover:opacity-80 transition-opacity"
          >
            Back to Trips
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[90vh]">

        {/* Header */}
        <div className="p-6 text-center relative flex justify-center items-center border-b border-secondary/10">
          <button
            onClick={() => router.push('/')}
            className="absolute left-6 text-secondary hover:text-primary transition-colors"
          >
            <i className="fas fa-chevron-left text-xl"></i>
          </button>
          <h1 className="text-xl font-semibold">Trip #{trip.tripNumber}</h1>
          <button
            onClick={toggleTheme}
            className="absolute right-6 text-secondary hover:text-primary transition-colors"
          >
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-xl`}></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-container">

          {/* Map */}
          {trip.locationCoords && (
            <section className="rounded-2xl overflow-hidden shadow-lg relative h-48">
              <MapComponent
                center={mapCenter}
                zoom={13}
                theme={theme}
                onLocationSelect={() => {}} // Read-only in detail view
                className="rounded-2xl"
              />
            </section>
          )}

          {/* Trip Overview */}
          <section className="space-y-4">
            <div className="flex items-center space-x-4 p-4 input-field rounded-xl">
              <div className="w-12 h-12 rounded-full accent-bg flex items-center justify-center text-white">
                <i className={`fas ${getModeIcon(trip.modeOfTransport)} text-lg`}></i>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{trip.modeOfTransport} Trip</h3>
                <p className="text-sm text-secondary">
                  Created on {formatDate(trip.createdAt)}
                </p>
              </div>
            </div>
          </section>

          {/* Location Details */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Location</h3>
            <div className="space-y-3">
              <div className="p-4 input-field rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full accent-bg flex items-center justify-center text-white">
                    <i className="fas fa-map-marker-alt text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-secondary">Origin</p>
                    <p className="font-medium">{trip.origin || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              {trip.destination && (
                <div className="p-4 input-field rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full accent-bg flex items-center justify-center text-white">
                      <i className="fas fa-flag text-sm"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-secondary">Destination</p>
                      <p className="font-medium">{trip.destination}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Schedule */}
          {(trip.departure || trip.arrival) && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Schedule</h3>
              <div className="space-y-3">
                {trip.departure && (
                  <div className="p-4 input-field rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full accent-bg flex items-center justify-center text-white">
                        <i className="fas fa-clock text-sm"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-secondary">Departure</p>
                        <p className="font-medium">{formatDate(trip.departure)}</p>
                        <p className="text-sm text-secondary">{formatTime(trip.departure)}</p>
                      </div>
                    </div>
                  </div>
                )}
                {trip.arrival && (
                  <div className="p-4 input-field rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full accent-bg flex items-center justify-center text-white">
                        <i className="fas fa-clock text-sm"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-secondary">Arrival</p>
                        <p className="font-medium">{formatDate(trip.arrival)}</p>
                        <p className="text-sm text-secondary">{formatTime(trip.arrival)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Weather Information */}
          {trip.weatherData && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Weather Information</h3>
              <div className="p-4 input-field rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full accent-bg flex items-center justify-center text-white">
                      <i className="fas fa-thermometer-half"></i>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Temperature</p>
                      <p className="font-semibold">{trip.weatherData.temperature}{trip.weatherData.temperatureUnit}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full accent-bg flex items-center justify-center text-white">
                      <i className="fas fa-wind"></i>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Wind Speed</p>
                      <p className="font-semibold">{trip.weatherData.windSpeed} {trip.weatherData.windSpeedUnit}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-secondary/20">
                  <p className="text-xs text-secondary">
                    Recorded: {new Date(trip.weatherData.time).toLocaleString()}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Travelers */}
          {trip.travelers.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Travelers ({trip.travelers.length})</h3>
              <div className="space-y-3">
                {trip.travelers.map((traveler) => (
                  <div key={traveler.id} className="flex items-center space-x-3 p-3 input-field rounded-xl">
                    <div className="w-8 h-8 rounded-full input-field flex items-center justify-center text-secondary">
                      <i className="fas fa-user text-sm"></i>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{traveler.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {trip.notes && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Notes</h3>
              <div className="p-4 input-field rounded-xl">
                <p className="text-primary whitespace-pre-wrap">{trip.notes}</p>
              </div>
            </section>
          )}

        </div>

        {/* Footer - Edit Button */}
        <div className="p-6">
          <button
            onClick={() => router.push(`/newtrip?edit=${trip.id}`)}
            className="w-full accent-bg text-white font-semibold py-3 rounded-xl shadow-lg hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] transition-opacity transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <i className="fas fa-edit"></i>
            <span>Edit Trip</span>
          </button>
        </div>
      </div>
    </div>
  )
}
