# FleetPulse

Fleet intelligence dashboard built on the GPS Dozor API. Displays live vehicle positions, cost and fuel analysis, driver efficiency rankings, and historical trip route inspection with weather context.

## Live Demo

**The application is fully deployed and accessible at:**

### [http://fleet-pulse.duckdns.org](http://fleet-pulse.duckdns.org)

Optimized for both desktop and mobile (tested on iOS Safari and Android Chrome). No installation required to evaluate the app.

---

## Architecture

The project is a monorepo with two workspaces:

- **`backend/`** — Fastify server acting as an authenticated proxy to the GPS Dozor API. Handles Basic Auth server-side (credentials never reach the browser), caches responses (30s for live vehicles, 5min for trips, 10min for history), and proxies Open-Meteo and Nominatim requests.
- **`frontend/`** — Vue 3 + Vite + Tailwind CSS application. Uses Leaflet for map rendering and Chart.js for cost/efficiency charts. Fetches all data from the local backend proxy.

## Running Locally

### Prerequisites

- Node.js 20+

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the backend

A `.env` file is already present in `backend/` with the public demo credentials. No action needed for evaluation. To use your own GPS Dozor account, update the values:

```
GPS_DOZOR_USER=api_gpsdozor
GPS_DOZOR_PASS=yakmwlARdn
GPS_DOZOR_BASE_URL=https://a1.gpsguard.eu/api/v1
PORT=3001
```

### 3. Development mode (hot reload)

Starts both the backend (port 3001) and the Vite dev server (port 5173) concurrently:

```bash
npm run dev
```

### 4. Production build + serve

Build the frontend for production, then start the backend which serves the compiled assets:

```bash
# Build the frontend
npm run build

# Start the backend (serves the built frontend from frontend/dist)
npm start --workspace=backend
```

The application will be available at `http://localhost:3001`.

If you prefer to serve the frontend separately (e.g. via nginx or a static host), the production build output is in `frontend/dist/`.

---

## External APIs

| API | Purpose | Auth |
|-----|---------|------|
| GPS Dozor (`a1.gpsguard.eu/api/v1`) | Live vehicles, trip logs, position history, branches | Basic Auth via backend `.env` |
| Open-Meteo (`archive-api.open-meteo.com`) | Historical weather at trip departure/arrival coordinates | None (free, no key) |
| Nominatim (`nominatim.openstreetmap.org`) | Reverse geocoding of live vehicle coordinates | None (User-Agent required) |
| CartoDB Dark Matter tiles | Map tile layer for Leaflet | None |

## Features

- **Command Center** — Live Leaflet map with real-time vehicle positions. Green markers for moving vehicles, gray for stationary. Fleet drawer on mobile.
- **Cost & Efficiency** — Line chart (daily fleet cost), bar chart (cost by vehicle), efficiency table with L/100km badges. Date range filter (7/14/30 days).
- **Driver Leaderboard** — Ranked by fuel efficiency, distance, trip count, or total cost. Driver detail panel with stats and recent trip list.
- **Trip Inspector** — Searchable trip list with route polyline replay, weather context at departure and arrival, and deep-link support from the driver view.
