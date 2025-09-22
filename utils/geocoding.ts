// Free geocoding service using Nominatim (OpenStreetMap)
// No API key required!

export interface GeocodingResult {
  place_id: string
  display_name: string
  lat: string
  lon: string
  type: string
  importance: number
}

export interface LocationCoords {
  lat: number
  lng: number
}

// Search for locations using Nominatim (free OpenStreetMap geocoding)
export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 3) {
    return []
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TripCaptureApp/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }

    const data = await response.json()
    return data || []
  } catch (error) {
    console.error('Error searching locations:', error)
    return []
  }
}

// Reverse geocoding - get address from coordinates
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TripCaptureApp/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Reverse geocoding request failed')
    }

    const data = await response.json()
    return data.display_name || `${lat}, ${lng}`
  } catch (error) {
    console.error('Error reverse geocoding:', error)
    return `${lat}, ${lng}`
  }
}

// Get coordinates for a location name
export async function getLocationCoords(locationName: string): Promise<LocationCoords | null> {
  const results = await searchLocations(locationName)

  if (results.length > 0) {
    const result = results[0]
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    }
  }

  return null
}
