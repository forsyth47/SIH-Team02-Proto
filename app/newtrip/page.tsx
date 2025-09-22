'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import LocationSearch from '../../components/LocationSearch'

// Dynamically import MapComponent to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-300 flex items-center justify-center rounded-2xl">
      <span className="text-gray-600">Loading Map...</span>
    </div>
  )
})

interface Traveler {
  id: string
  name: string
}

interface TripData {
  tripNumber: string
  origin: string
  destination: string
  modeOfTransport: string
  departure: string
  arrival: string
  travelers: Traveler[]
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
}

export default function NewTrip() {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [tripData, setTripData] = useState<TripData>({
    tripNumber: '1',
    origin: '',
    destination: '',
    modeOfTransport: 'Car',
    departure: '',
    arrival: '',
    travelers: [],
    notes: ''
  })
  const [travelers, setTravelers] = useState<Traveler[]>([])
  const [selectedMode, setSelectedMode] = useState(0)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]) // San Francisco default
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  const modes = [
    { name: 'Car', icon: 'fa-car' },
    { name: 'Bike', icon: 'fa-person-biking' },
    { name: 'Train', icon: 'fa-train' },
    { name: 'Cycle', icon: 'fa-bicycle' },
    { name: 'Walk', icon: 'fa-person-walking' },
    { name: 'Other', icon: 'fa-ellipsis-h' }
  ]

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      setTheme('light') // Default to light theme
    }
  }, [])

  // Fetch existing trips to generate auto trip number
  useEffect(() => {
    const fetchTripCount = async () => {
      try {
        const response = await fetch('/api/trips')
        if (response.ok) {
          const trips = await response.json()
          const tripCount = trips.length
          setTripData(prev => ({ ...prev, tripNumber: (tripCount + 1).toString() }))
        }
      } catch (error) {
        console.error('Error fetching trip count:', error)
        // If error, keep default trip number
      }
    }

    fetchTripCount()
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

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setTripData(prev => ({
      ...prev,
      origin: location.address,
      locationCoords: {
        lat: location.lat,
        lng: location.lng
      }
    }))
    setMapCenter([location.lat, location.lng])
  }

  const handleMapLocationSelect = (lat: number, lng: number) => {
    setTripData(prev => ({
      ...prev,
      locationCoords: { lat, lng }
    }))
  }

  const fetchWeatherData = async (lat: number, lng: number) => {
    setWeatherLoading(true)
    setWeatherError(null)

    try {
      const response = await fetch(`/api/weather?lat=${lat}&lng=${lng}`)
      if (!response.ok) {
        throw new Error('Failed to fetch weather data')
      }

      const weatherData = await response.json()
      setTripData(prev => ({
        ...prev,
        weatherData: {
          temperature: weatherData.temperature,
          temperatureUnit: weatherData.temperatureUnit,
          windSpeed: weatherData.windSpeed,
          windSpeedUnit: weatherData.windSpeedUnit,
          time: weatherData.time
        }
      }))
    } catch (error) {
      console.error('Error fetching weather:', error)
      setWeatherError('Failed to fetch weather data')
    } finally {
      setWeatherLoading(false)
    }
  }

  const handleLocationSelectWithWeather = (location: { lat: number; lng: number; address: string }) => {
    setTripData(prev => ({
      ...prev,
      origin: location.address,
      locationCoords: {
        lat: location.lat,
        lng: location.lng
      }
    }))
    setMapCenter([location.lat, location.lng])

    // Debounce weather fetch to avoid too many API calls
    setTimeout(() => {
      fetchWeatherData(location.lat, location.lng)
    }, 1000)
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleModeSelect = (index: number) => {
    setSelectedMode(index)
    setTripData(prev => ({ ...prev, modeOfTransport: modes[index].name }))
  }

  const addTraveler = () => {
    const newTraveler: Traveler = {
      id: Date.now().toString(),
      name: ''
    }
    setTravelers(prev => [...prev, newTraveler])
  }

  const removeTraveler = (id: string) => {
    setTravelers(prev => prev.filter(t => t.id !== id))
  }

  const updateTravelerName = (id: string, name: string) => {
    setTravelers(prev => prev.map(t => t.id === id ? { ...t, name } : t))
  }

  const saveTrip = async () => {
    setShowSaveModal(true)

    try {
      const tripToSave = {
        ...tripData,
        travelers: travelers.filter(t => t.name.trim() !== ''),
        createdAt: new Date().toISOString(),
        id: Date.now().toString()
      }

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripToSave),
      })

      if (response.ok) {
        setTimeout(() => {
          setShowSaveModal(false)
          setShowSuccessModal(true)
          setTimeout(() => {
            setShowSuccessModal(false)
            router.push('/') // Navigate back to home page after saving
          }, 1500)
        }, 2000)
      } else {
        throw new Error('Failed to save trip')
      }
    } catch (error) {
      console.error('Error saving trip:', error)
      setShowSaveModal(false)
      alert('Failed to save trip. Please try again.')
    }
  }

  const renderCalendar = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const startDay = firstDayOfMonth.getDay()
    const firstDayAdjusted = startDay === 0 ? 6 : startDay - 1

    const today = new Date()
    const cells = []

    // Empty cells for padding
    for (let i = 0; i < firstDayAdjusted; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2"></div>)
    }

    // Day cells
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const isToday = i === today.getDate() &&
                     currentDate.getMonth() === today.getMonth() &&
                     currentDate.getFullYear() === today.getFullYear()

      cells.push(
        <div
          key={i}
          className={`p-2 text-sm rounded-lg custom-calendar-cell ${
            isToday ? 'accent-bg text-white font-bold' : ''
          }`}
        >
          {i}
        </div>
      )
    }

    return (
      <div className="p-4 input-field rounded-xl">
        <p className="text-center text-sm text-secondary mb-2">Today&apos;s Date</p>
        <div className="flex justify-between items-center mb-4">
          <button
            className="text-secondary hover:text-primary"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <span className="font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            className="text-secondary hover:text-primary"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
        <div className="grid grid-cols-7 text-center text-secondary text-sm font-medium mb-2">
          <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
        </div>
        <div className="grid grid-cols-7 text-center">
          {cells}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[90vh]">

        {/* Header */}
        <div className="p-6 text-center relative flex justify-center items-center">
          <button 
            onClick={() => router.push('/')}
            className="absolute left-6 text-secondary hover:text-primary transition-colors"
          >
            <i className="fas fa-chevron-left text-xl"></i>
          </button>
          <h1 className="text-xl font-semibold">New Trip</h1>
          <button
            onClick={toggleTheme}
            className="absolute right-6 text-secondary hover:text-primary transition-colors"
          >
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-xl`}></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-container">

          {/* Map */}
          <section className="rounded-2xl overflow-hidden shadow-lg relative h-48">
            <MapComponent
              center={mapCenter}
              zoom={13}
              theme={theme}
              onLocationSelect={handleMapLocationSelect}
              className="rounded-2xl"
            />
          </section>

          {/* Trip Details */}
          <section className="space-y-6">
            {/* Trip Number */}
            <div>
              <label className="block text-secondary text-sm mb-1">Trip Number</label>
              <div className="flex items-center space-x-2">
                <span
                  contentEditable
                  suppressContentEditableWarning
                  className="text-3xl font-bold border-b-2 border-transparent focus:outline-none focus:border-[var(--accent-blue)] cursor-pointer"
                  onBlur={(e) => {
                    const value = e.currentTarget.textContent || '17'
                    setTripData(prev => ({ ...prev, tripNumber: value }))
                    if (!value.trim()) {
                      e.currentTarget.textContent = '17'
                    }
                  }}
                >
                  {tripData.tripNumber}
                </span>
                <span className="text-secondary text-sm">(Autogenerated, click to edit)</span>
              </div>
            </div>

            {/* Origin */}
            <div>
              <label htmlFor="origin" className="block text-secondary text-sm mb-2">Origin Location</label>
              <LocationSearch
                value={tripData.origin}
                onChange={(value) => setTripData(prev => ({ ...prev, origin: value }))}
                onLocationSelect={handleLocationSelectWithWeather}
                placeholder="Search location..."
              />
            </div>

            {/* Mode of Transport */}
            <div>
              <label className="block text-secondary text-sm mb-2">Mode of Transport</label>
              <div className="flex flex-wrap gap-3">
                {modes.map((mode, index) => (
                  <div
                    key={mode.name}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl input-field text-secondary hover:opacity-80 transition-colors cursor-pointer icon-container ${
                      selectedMode === index ? 'selected' : ''
                    }`}
                    onClick={() => handleModeSelect(index)}
                  >
                    <div className="text-lg mb-1">
                      <i className={`fa-solid ${mode.icon}`}></i>
                    </div>
                    <span className="text-xs font-medium">{mode.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Departure & Arrival */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="departure" className="block text-secondary text-sm mb-2">Departure Time & Date</label>
                <input
                  type="datetime-local"
                  id="departure"
                  value={tripData.departure}
                  onChange={(e) => setTripData(prev => ({ ...prev, departure: e.target.value }))}
                  className="w-full px-4 py-3 input-field rounded-xl border border-transparent focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] outline-none transition-colors"
                />
              </div>
              <div>
                <label htmlFor="arrival" className="block text-secondary text-sm mb-2">Arrival Time & Date</label>
                <input
                  type="datetime-local"
                  id="arrival"
                  value={tripData.arrival}
                  onChange={(e) => setTripData(prev => ({ ...prev, arrival: e.target.value }))}
                  className="w-full px-4 py-3 input-field rounded-xl border border-transparent focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] outline-none transition-colors"
                />
              </div>
            </div>

            {/* Calendar */}
            {renderCalendar()}

            {/* Weather Information */}
            {tripData.locationCoords && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Weather Information</h2>
                  <button
                    onClick={() => fetchWeatherData(tripData.locationCoords!.lat, tripData.locationCoords!.lng)}
                    disabled={weatherLoading}
                    className="accent-bg text-white rounded-full p-2 hover:opacity-80 transition-opacity disabled:opacity-50"
                    title="Refresh weather data"
                  >
                    <i className={`fas fa-cloud-sun text-sm ${weatherLoading ? 'animate-spin' : ''}`}></i>
                  </button>
                </div>

                {weatherLoading && (
                  <div className="p-4 input-field rounded-xl text-center">
                    <div className="inline-flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-secondary text-sm">Fetching weather data...</span>
                    </div>
                  </div>
                )}

                {weatherError && (
                  <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-exclamation-triangle text-red-500"></i>
                      <span className="text-red-700 dark:text-red-300 text-sm">{weatherError}</span>
                    </div>
                  </div>
                )}

                {tripData.weatherData && !weatherLoading && (
                  <div className="p-4 input-field rounded-xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full accent-bg flex items-center justify-center text-white">
                          <i className="fas fa-thermometer-half"></i>
                        </div>
                        <div>
                          <p className="text-xs text-secondary">Temperature</p>
                          <p className="font-semibold">{tripData.weatherData.temperature}{tripData.weatherData.temperatureUnit}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full accent-bg flex items-center justify-center text-white">
                          <i className="fas fa-wind"></i>
                        </div>
                        <div>
                          <p className="text-xs text-secondary">Wind Speed</p>
                          <p className="font-semibold">{tripData.weatherData.windSpeed} {tripData.weatherData.windSpeedUnit}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-secondary/20">
                      <p className="text-xs text-secondary">
                        Last updated: {new Date(tripData.weatherData.time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {!tripData.locationCoords && (
                  <div className="p-4 input-field rounded-xl text-center">
                    <i className="fas fa-map-marker-alt text-secondary text-2xl mb-2"></i>
                    <p className="text-secondary text-sm">Select a location to view weather information</p>
                  </div>
                )}
              </div>
            )}

            {/* Travelers */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Accompanying Travelers</h2>
                <button
                  onClick={addTraveler}
                  className="accent-bg text-white rounded-full p-2 hover:opacity-80 transition-opacity"
                >
                  <i className="fas fa-plus text-sm"></i>
                </button>
              </div>
              <div className="space-y-3">
                {travelers.length === 0 ? (
                  <p className="text-secondary text-sm">No travelers added</p>
                ) : (
                  travelers.map((traveler) => (
                    <div key={traveler.id} className="flex items-center space-x-2 p-3 input-field rounded-xl">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full input-field flex items-center justify-center text-secondary">
                        <i className="fas fa-user text-sm"></i>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Traveler Name"
                          value={traveler.name}
                          onChange={(e) => updateTravelerName(traveler.id, e.target.value)}
                          className="w-full bg-transparent text-primary placeholder-secondary outline-none"
                        />
                      </div>
                      <button
                        onClick={() => removeTraveler(traveler.id)}
                        className="text-secondary hover:text-primary transition-colors"
                      >
                        <i className="fas fa-times text-sm"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-secondary text-sm mb-2">Notes</label>
              <textarea
                id="notes"
                rows={4}
                placeholder="Briefly describe the purpose of this trip, Along Add any additional information, if needed..."
                value={tripData.notes}
                onChange={(e) => setTripData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-3 input-field rounded-xl border border-transparent focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] outline-none transition-colors placeholder-secondary"
              />
            </div>
          </section>
        </div>

        {/* Footer Button */}
        <div className="p-6">
          <button
            onClick={saveTrip}
            className="w-full accent-bg text-white font-semibold py-3 rounded-xl shadow-lg hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] transition-opacity transform hover:scale-105"
          >
            Save Trip
          </button>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-4 transition-opacity duration-300">
          <div className="loader mb-4"></div>
          <p className="text-white text-lg font-semibold">Saving Trip...</p>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-4 transition-opacity duration-300">
          <div className="flex items-center justify-center">
            <svg className="checkmark text-white" viewBox="0 0 52 52">
              <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
          <p className="text-white text-lg font-semibold mt-4 text-center">Trip Saved!</p>
        </div>
      )}
    </div>
  )
}
