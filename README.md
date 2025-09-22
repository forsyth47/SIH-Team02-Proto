# Trip Capture - Next.js App

A modern trip management application built with Next.js, featuring real-time location search, interactive maps, and cloud database integration - **completely free with no API keys required!**

## Features

- 🗺️ **Interactive OpenStreetMap Integration** - Free maps using Leaflet and OpenStreetMap
- 🔍 **Free Location Search & Autocomplete** - Using Nominatim geocoding service (no API key needed!)
- 🌙 **Dark/Light Theme Toggle** - Persistent theme preferences with map theme switching
- 👥 **Traveler Management** - Add and manage accompanying travelers
- 🚗 **Multiple Transport Modes** - Car, bike, train, cycle, walking, and more
- 📅 **Date & Time Selection** - Interactive calendar and datetime pickers
- ☁️ **Cloud Database Storage** - Data stored in JsonSilo cloud database
- 📱 **Responsive Design** - Mobile-first responsive UI
- 💰 **100% Free** - No API keys, no credit cards, no subscriptions required!

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**That's it!** No API keys needed - everything works out of the box!

## Free Services Used

### Maps & Location
- **OpenStreetMap** - Free, open-source map tiles
- **Leaflet** - Free, lightweight mapping library
- **Stadia Maps Dark Theme** - Free dark mode map tiles
- **Nominatim** - Free geocoding service by OpenStreetMap

### Database
- **JsonSilo** - Free cloud JSON database (already configured)

## Project Structure

```
├── app/
│   ├── api/
│   │   └── trips/
│   │       └── route.ts          # API routes for trip CRUD operations
│   ├── globals.css               # Global styles and CSS variables
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Main trip creation page
├── components/
│   ├── LocationSearch.tsx        # Free location search component
│   └── MapComponent.tsx          # Free map component using Leaflet
├── utils/
│   └── geocoding.ts              # Free geocoding utilities
├── .env.local                    # Environment variables (JsonSilo only)
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── tailwind.config.js            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## API Endpoints

### GET /api/trips
Fetch all trips from the JsonSilo database

### GET /api/trips/count
Get current trip count for auto-numbering
```json
{
  "count": 5,
  "nextTripNumber": 6
}
```

### POST /api/trips
Create a new trip using JsonSilo PATCH API
```json
{
  "tripNumber": "1",
  "origin": "San Francisco, CA",
  "destination": "",
  "modeOfTransport": "Car",
  "departure": "2024-01-01T10:00",
  "arrival": "2024-01-01T14:00",
  "travelers": [
    { "id": "1", "name": "John Doe" }
  ],
  "notes": "Business trip",
  "locationCoords": {
    "lat": 37.7749,
    "lng": -122.4194
  }
}
```

### PUT /api/trips
Update an existing trip using JsonSilo PATCH API

### DELETE /api/trips?id={tripId}
Delete a trip by ID using JsonSilo PATCH API

**Note**: All database operations use the JsonSilo `PATCH` method with the `X-MAN-API` header format as specified in their documentation.

## Database Structure

The app uses JsonSilo as a cloud JSON database with the correct API format. Data is stored in the following structure:

```json
{
  "file_name": "trips_data",
  "file_data": {
    "trips": [
      {
        "id": "1640995200000",
        "tripNumber": "1",
        "origin": "San Francisco, CA",
        "destination": "",
        "modeOfTransport": "Car",
        "departure": "2024-01-01T10:00",
        "arrival": "2024-01-01T14:00",
        "travelers": [
          { "id": "1", "name": "John Doe" }
        ],
        "notes": "Business trip",
        "locationCoords": {
          "lat": 37.7749,
          "lng": -122.4194
        },
        "createdAt": "2024-01-01T09:00:00.000Z"
      }
    ]
  },
  "region_name": "api",
  "is_public": false
}
```

**Auto Trip Numbering**: The app automatically fetches existing trips and sets the trip number to `(trip_count + 1)`.

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Leaflet** - Free, lightweight interactive map library
- **OpenStreetMap** - Free, open-source map data
- **Nominatim** - Free geocoding service
- **JsonSilo** - Cloud JSON database
- **Font Awesome** - Icon library
- **Inter Font** - Modern typography

## Building for Production

```bash
npm run build
npm start
```

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Browser Support

This app supports all modern browsers that support ES6+ features. For the best experience, use:
- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

## Troubleshooting

### Maps not loading
- Check browser console for any network errors
- Ensure you have a stable internet connection
- Try refreshing the page

### Location search not working
- Verify you have internet connectivity
- The Nominatim service has rate limits - wait a few seconds between searches
- Check browser console for any errors

### Database operations failing
- Verify JsonSilo API credentials are correct in `.env.local`
- Check network connectivity
- Review browser console for API errors

## Rate Limits & Fair Usage

The free services we use have some limitations:
- **Nominatim**: 1 request per second limit for location search
- **OpenStreetMap tiles**: Fair usage policy applies
- **JsonSilo**: Check their free tier limits

These are very generous limits for personal and development use!

## License

This project is for demonstration purposes. Please ensure you comply with OpenStreetMap usage policies and JsonSilo terms of service.
