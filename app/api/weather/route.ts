import { NextRequest, NextResponse } from 'next/server'

interface WeatherData {
  latitude: number
  longitude: number
  current: {
    temperature_2m: number
    wind_speed_10m: number
    time: string
  }
  current_units: {
    temperature_2m: string
    wind_speed_10m: string
  }
}

// GET - Fetch weather data for given coordinates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
    }

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m`
    )

    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data')
    }

    const weatherData: WeatherData = await weatherResponse.json()

    return NextResponse.json({
      temperature: weatherData.current.temperature_2m,
      temperatureUnit: weatherData.current_units.temperature_2m,
      windSpeed: weatherData.current.wind_speed_10m,
      windSpeedUnit: weatherData.current_units.wind_speed_10m,
      time: weatherData.current.time,
      coordinates: {
        lat: weatherData.latitude,
        lng: weatherData.longitude
      }
    })
  } catch (error) {
    console.error('Error fetching weather:', error)
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 })
  }
}
