'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

interface DeleteModalProps {
  isOpen: boolean
  tripNumber: string
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirmationModal({ isOpen, tripNumber, onConfirm, onCancel }: DeleteModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="card rounded-2xl p-6 w-full max-w-sm">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold mb-2">Delete Trip</h3>
          <p className="text-secondary mb-6">
            Are you sure you want to delete Trip #{tripNumber}? This action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 input-field rounded-xl text-secondary hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [trips, setTrips] = useState<TripData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    tripId: string
    tripNumber: string
  }>({
    isOpen: false,
    tripId: '',
    tripNumber: ''
  })

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
    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/trips')
      if (response.ok) {
        const tripsData = await response.json()
        setTrips(tripsData.sort((a: TripData, b: TripData) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ))
      } else {
        throw new Error('Failed to fetch trips')
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
      setError('Failed to load trips')
    } finally {
      setLoading(false)
    }
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleDeleteTrip = (tripId: string, tripNumber: string) => {
    setDeleteModal({
      isOpen: true,
      tripId,
      tripNumber
    })
  }

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/trips?id=${deleteModal.tripId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTrips(prev => prev.filter(trip => trip.id !== deleteModal.tripId))
        setDeleteModal({ isOpen: false, tripId: '', tripNumber: '' })
      } else {
        throw new Error('Failed to delete trip')
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
      alert('Failed to delete trip. Please try again.')
    }
  }

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, tripId: '', tripNumber: '' })
  }

  const handleTripClick = (tripId: string) => {
    router.push(`/trips/${tripId}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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
            <p className="text-secondary">Loading trips...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="p-6 text-center relative flex justify-center items-center border-b border-secondary/10">
          <h1 className="text-xl font-semibold">My Trips</h1>
          <button
            onClick={toggleTheme}
            className="absolute right-6 text-secondary hover:text-primary transition-colors"
          >
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-xl`}></i>
          </button>
        </div>

        {/* Trip List */}
        <div className="flex-1 overflow-y-auto p-6 scroll-container">
          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 mb-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-exclamation-triangle text-red-500"></i>
                <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
              </div>
            </div>
          )}

          {trips.length === 0 && !error ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full input-field flex items-center justify-center">
                <i className="fas fa-route text-secondary text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
              <p className="text-secondary text-sm mb-6">Create your first trip to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => handleTripClick(trip.id)}
                  className="p-4 input-field rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 rounded-full accent-bg flex items-center justify-center text-white">
                          <i className={`fas ${getModeIcon(trip.modeOfTransport)} text-sm`}></i>
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">Trip #{trip.tripNumber}</h3>
                          <p className="text-xs text-secondary">{formatDate(trip.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{trip.origin || 'No origin set'}</p>
                        {trip.destination && (
                          <p className="text-xs text-secondary">→ {trip.destination}</p>
                        )}
                        {trip.travelers.length > 0 && (
                          <p className="text-xs text-secondary">
                            <i className="fas fa-users mr-1"></i>
                            {trip.travelers.length} traveler{trip.travelers.length !== 1 ? 's' : ''}
                          </p>
                        )}
                        {trip.weatherData && (
                          <p className="text-xs text-secondary">
                            <i className="fas fa-thermometer-half mr-1"></i>
                            {trip.weatherData.temperature}{trip.weatherData.temperatureUnit}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTrip(trip.id, trip.tripNumber)
                      }}
                      className="ml-3 p-2 text-secondary hover:text-red-500 transition-colors"
                      title="Delete trip"
                    >
                      <i className="fas fa-trash text-sm"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Trip Button */}
        <div className="p-6">
          <button
            onClick={() => router.push('/newtrip')}
            className="w-full accent-bg text-white font-semibold py-4 rounded-xl shadow-lg hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] transition-opacity transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <i className="fas fa-plus"></i>
            <span>New Trip</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        tripNumber={deleteModal.tripNumber}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}
