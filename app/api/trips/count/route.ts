import { NextResponse } from 'next/server'

const JSONSILO_API_URL = process.env.JSONSILO_API_URL
const JSONSILO_API_KEY = process.env.JSONSILO_API_KEY

interface JsonSiloResponse {
  file_name: string
  file_data: {
    trips: Array<any>
  }
  region_name: string
  is_public: boolean
}

// GET - Get trip count for auto-generation
export async function GET() {
  try {
    const response = await fetch(JSONSILO_API_URL!, {
      method: 'GET',
      headers: {
        'X-MAN-API': JSONSILO_API_KEY!,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch trips')
    }

    const data: JsonSiloResponse = await response.json()
    const tripCount = data.file_data?.trips?.length || 0
    return NextResponse.json({ count: tripCount, nextTripNumber: tripCount + 1 })
  } catch (error) {
    console.error('Error fetching trip count:', error)
    return NextResponse.json({ count: 0, nextTripNumber: 1 })
  }
}
