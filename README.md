# FleetPulse

Fleet management dashboard integrating GPS Dozor live data with visualization, cost analysis, and driver performance tracking.

## Architecture

The system is split into two main components:
- **Backend:** Fastify API proxy that routes requests to the GPS Dozor, Nominatim, and Open-Meteo APIs. It includes an in-memory caching layer to prevent rate-limiting and accelerate data retrieval.
- **Frontend:** Vue 3 application built with Vite and Tailwind CSS. It uses Leaflet for map visualizations and fetches data exclusively from the local backend proxy.

## Setup Instructions

### Prerequisites
- Node.js 20+

### Installation

1. Install all dependencies across the monorepo:
   ```bash
   npm install
   ```

2. Create a `.env` file in the `backend` directory (default values are already provided in the repository for the demo):
   ```
   GPS_DOZOR_USER=api_gpsdozor
   GPS_DOZOR_PASS=yakmwlARdn
   GPS_DOZOR_BASE_URL=https://a1.gpsguard.eu/api/v1
   PORT=3001
   ```

### Running the Application

Start both the backend server and the frontend development server concurrently:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3001`.

## Features

- **Command Center:** Live map visualization of fleet vehicles with real-time location and speed data.
- **Cost & Efficiency:** Financial breakdown of fuel costs and distances over a selected time period.
- **Driver Leaderboard:** Ranking system comparing driver performance based on fuel efficiency metrics.
- **Trip Inspector:** Route history visualization and local weather condition checks.

## API Integration

- **GPS Dozor:** Provides vehicle state, coordinates, trip logs, and branch configurations.
- **Open-Meteo:** Supplies historical weather data correlating with trip timelines.
- **Nominatim (OpenStreetMap):** Reverse geocoding for transforming raw coordinates into human-readable locations.
