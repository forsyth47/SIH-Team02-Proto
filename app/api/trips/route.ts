import { NextRequest, NextResponse } from 'next/server'

const JSONSILO_API_URL = process.env.JSONSILO_API_URL
const JSONSILO_API_KEY = process.env.JSONSILO_API_KEY

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

interface JsonSiloResponse {
  file_name: string
  file_data: {
    trips: TripData[]
  }
  region_name: string
  is_public: boolean
}

// GET - Fetch all trips
export async function GET() {
  try {
    if (!JSONSILO_API_URL || !JSONSILO_API_KEY) {
      console.error('Missing environment variables:', {
        hasUrl: !!JSONSILO_API_URL,
        hasKey: !!JSONSILO_API_KEY
      })
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const response = await fetch(JSONSILO_API_URL, {
      method: 'GET',
      headers: {
        'X-MAN-API': JSONSILO_API_KEY,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('JsonSilo API error:', response.status, errorText)
      throw new Error(`Failed to fetch trips: ${response.status}`)
    }

    const data: JsonSiloResponse = await response.json()
    console.log('JsonSilo API response:', data) // Debug log

    // Handle both response formats - direct trips array or wrapped in file_data
    let trips: TripData[] = []
    if (data.file_data?.trips) {
      trips = data.file_data.trips
    } else if ((data as any).trips) {
      trips = (data as any).trips
    } else {
      trips = []
    }

    console.log('Processed trips:', trips.length) // Debug log
    return NextResponse.json(trips)
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
  }
}

// POST - Create a new trip
export async function POST(request: NextRequest) {
  try {
    if (!JSONSILO_API_URL || !JSONSILO_API_KEY) {
      console.error('Missing environment variables:', {
        hasUrl: !!JSONSILO_API_URL,
        hasKey: !!JSONSILO_API_KEY
      })
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const tripData: TripData = await request.json()

    // First, get existing data
    const getResponse = await fetch(JSONSILO_API_URL, {
      method: 'GET',
      headers: {
        'X-MAN-API': JSONSILO_API_KEY,
      },
    })

    let existingData: JsonSiloResponse = {
      file_name: 'trips_data',
      file_data: { trips: [] },
      region_name: 'api',
      is_public: false
    }

    if (getResponse.ok) {
      try {
        const responseData = await getResponse.json()
        console.log('GET response data:', responseData) // Debug log

        // Handle both response formats
        if (responseData.file_data?.trips) {
          existingData.file_data.trips = responseData.file_data.trips
        } else if (responseData.trips) {
          existingData.file_data.trips = responseData.trips
        }
      } catch (error) {
        console.error('Error parsing existing data:', error)
        // If parsing fails, start with empty structure
        existingData.file_data = { trips: [] }
      }
    }

    // Add new trip
    existingData.file_data.trips.push(tripData)

    // For JsonSilo, send as object with trips array (matching current structure)
    const dataToSend = {
      file_name: 'trips_data',
      file_data: { trips: existingData.file_data.trips },
      region_name: 'api',
      is_public: false
    }

    console.log('Sending PATCH data:', JSON.stringify(dataToSend, null, 2)) // Debug log

    // Save updated data using PATCH method
    const patchResponse = await fetch(JSONSILO_API_URL, {
      method: 'PATCH',
      headers: {
        'X-MAN-API': JSONSILO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    })

    if (!patchResponse.ok) {
      const errorText = await patchResponse.text()
      console.error('JsonSilo PATCH error:', patchResponse.status, errorText)
      throw new Error(`Failed to save trip: ${patchResponse.status}`)
    }

    return NextResponse.json({ message: 'Trip saved successfully', trip: tripData })
  } catch (error) {
    console.error('Error saving trip:', error)
    return NextResponse.json({ error: 'Failed to save trip' }, { status: 500 })
  }
}

// PUT - Update an existing trip
export async function PUT(request: NextRequest) {
  try {
    if (!JSONSILO_API_URL || !JSONSILO_API_KEY) {
      console.error('Missing environment variables:', {
        hasUrl: !!JSONSILO_API_URL,
        hasKey: !!JSONSILO_API_KEY
      })
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const updatedTrip: TripData = await request.json()

    // Get existing data
    const getResponse = await fetch(JSONSILO_API_URL, {
      method: 'GET',
      headers: {
        'X-MAN-API': JSONSILO_API_KEY,
      },
    })

    if (!getResponse.ok) {
      throw new Error('Failed to fetch existing trips')
    }

    const responseData = await getResponse.json()

    // Handle both response formats
    let trips: TripData[] = []
    if (responseData.file_data?.trips) {
      trips = responseData.file_data.trips
    } else if (responseData.trips) {
      trips = responseData.trips
    }

    // Find and update the trip
    const tripIndex = trips.findIndex((trip: TripData) => trip.id === updatedTrip.id)

    if (tripIndex === -1) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    trips[tripIndex] = updatedTrip

    // Save updated data with JsonSilo structure (object with trips array)
    const patchResponse = await fetch(JSONSILO_API_URL, {
      method: 'PATCH',
      headers: {
        'X-MAN-API': JSONSILO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_name: 'trips_data',
        file_data: { trips },
        region_name: 'api',
        is_public: false
      }),
    })

    if (!patchResponse.ok) {
      throw new Error('Failed to update trip')
    }

    return NextResponse.json({ message: 'Trip updated successfully', trip: updatedTrip })
  } catch (error) {
    console.error('Error updating trip:', error)
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
  }
}

// DELETE - Delete a trip
export async function DELETE(request: NextRequest) {
  try {
    if (!JSONSILO_API_URL || !JSONSILO_API_KEY) {
      console.error('Missing environment variables:', {
        hasUrl: !!JSONSILO_API_URL,
        hasKey: !!JSONSILO_API_KEY
      })
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('id')

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })
    }

    // Get existing data
    const getResponse = await fetch(JSONSILO_API_URL, {
      method: 'GET',
      headers: {
        'X-MAN-API': JSONSILO_API_KEY,
      },
    })

    if (!getResponse.ok) {
      throw new Error('Failed to fetch existing trips')
    }

    const responseData = await getResponse.json()

    // Handle both response formats
    let trips: TripData[] = []
    if (responseData.file_data?.trips) {
      trips = responseData.file_data.trips
    } else if (responseData.trips) {
      trips = responseData.trips
    }

    // Filter out the trip to delete
    const originalLength = trips.length
    trips = trips.filter((trip: TripData) => trip.id !== tripId)

    if (trips.length === originalLength) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Save updated data with JsonSilo structure (object with trips array)
    const patchResponse = await fetch(JSONSILO_API_URL, {
      method: 'PATCH',
      headers: {
        'X-MAN-API': JSONSILO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_name: 'trips_data',
        file_data: { trips },
        region_name: 'api',
        is_public: false
      }),
    })

    if (!patchResponse.ok) {
      throw new Error('Failed to delete trip')
    }

    return NextResponse.json({ message: 'Trip deleted successfully' })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 })
  }
}
