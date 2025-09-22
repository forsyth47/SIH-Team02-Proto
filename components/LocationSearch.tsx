'use client'

import { useState, useEffect, useRef } from 'react'
import { searchLocations, GeocodingResult } from '../utils/geocoding'

interface LocationSearchProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void
  placeholder?: string
  className?: string
}

export default function LocationSearch({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Search location...",
  className = ""
}: LocationSearchProps) {
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasFocus, setHasFocus] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    // Don't search for very short queries
    if (value.trim().length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Debounce search requests
    searchTimeout.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const results = await searchLocations(value)
        setSuggestions(results)
        setShowSuggestions(true)
      } catch (error) {
        console.error('Error searching locations:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [value])

  // Handle clicks outside the component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setHasFocus(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSuggestionClick = (suggestion: GeocodingResult) => {
    const location = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      address: suggestion.display_name
    }

    onChange(suggestion.display_name)
    onLocationSelect(location)
    setShowSuggestions(false)
    setSuggestions([])
    setHasFocus(false)
    
    // Remove focus from input after selection
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleInputBlur = () => {
    setHasFocus(false)
    // Delay hiding suggestions to allow for suggestion clicks
    setTimeout(() => {
      if (!hasFocus) {
        setShowSuggestions(false)
      }
    }, 150)
  }

  const handleInputFocus = () => {
    setHasFocus(true)
    if (suggestions.length > 0 && value.trim().length >= 3) {
      setShowSuggestions(true)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-secondary"></i>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`w-full pl-12 pr-16 py-3 input-field rounded-xl border border-transparent focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] outline-none transition-colors placeholder-secondary ${className}`}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex space-x-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
          )}
          <button className="p-2 rounded-full accent-bg text-white hover:opacity-80 transition-opacity">
            <i className="fas fa-map-marker-alt"></i>
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              className="px-4 py-3 hover:bg-[var(--bg-input)] cursor-pointer border-b border-[var(--border-color)] last:border-b-0 transition-colors"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start space-x-3">
                <i className="fas fa-map-marker-alt text-secondary mt-1 text-sm"></i>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-primary truncate">
                    {suggestion.display_name.split(',')[0]}
                  </div>
                  <div className="text-xs text-secondary truncate">
                    {suggestion.display_name}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && suggestions.length === 0 && value.trim().length >= 3 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg z-50">
          <div className="px-4 py-3 text-sm text-secondary text-center">
            No locations found for "{value}"
          </div>
        </div>
      )}
    </div>
  )
}
