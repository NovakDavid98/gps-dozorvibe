<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useFleetStore, type Trip } from '../stores/fleet'
import { apiClient } from '../api/client'
import { format } from 'date-fns'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const store = useFleetStore()
const route = useRoute()

const selectedTrip = ref<Trip | null>(null)
const loadingHistory = ref(false)
const loadingWeather = ref(false)
const weatherStart = ref<any>(null)
const weatherEnd = ref<any>(null)
const searchQuery = ref('')
const filterDriver = ref('')

let map: L.Map | null = null
let routeLine: L.Polyline | null = null
let startMarker: L.Marker | null = null
let endMarker: L.Marker | null = null

const pinIcon = (color: string) => L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #0b0f1a;box-shadow:0 0 8px ${color}80"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
})

// Mobile: toggle between list and map tab
const mobileTab = ref<'list' | 'map'>('list')

onMounted(async () => {
  if (store.allTrips.length === 0) await store.fetchAllTrips()

  await nextTick()
  map = L.map('trip-map', {
    zoomControl: false,
    attributionControl: false,
    ...(({ tap: false }) as any),
  } as L.MapOptions).setView([50, 15], 5)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    detectRetina: true,
  }).addTo(map)
  await nextTick()
  map.invalidateSize()

  const tripId = route.query.tripId ? Number(route.query.tripId) : null
  if (tripId) {
    const found = store.allTrips.find(t => t.Id === tripId)
    if (found) {
      mobileTab.value = 'map'
      selectTrip(found)
    }
  }
})

onUnmounted(() => { if (map) map.remove() })

const filteredTrips = computed(() => {
  let trips = store.allTrips
  const q = searchQuery.value.toLowerCase()
  if (q) {
    trips = trips.filter(t =>
      t.DriverName?.toLowerCase().includes(q) ||
      t.StartAddress?.toLowerCase().includes(q) ||
      t.FinishAddress?.toLowerCase().includes(q) ||
      t.vehicleName?.toLowerCase().includes(q)
    )
  }
  if (filterDriver.value) {
    trips = trips.filter(t => t.DriverName === filterDriver.value)
  }
  return trips.slice(0, 60)
})

const uniqueDrivers = computed(() =>
  [...new Set(store.allTrips.map(t => t.DriverName).filter(Boolean))].sort()
)

const formatDate = (iso: string) => {
  try { return format(new Date(iso), 'MMM d, HH:mm') } catch { return iso }
}

const selectTrip = async (trip: Trip) => {
  selectedTrip.value = trip
  weatherStart.value = null
  weatherEnd.value = null
  // Switch to map tab on mobile when a trip is selected
  mobileTab.value = 'map'
  await nextTick()
  map?.invalidateSize()
  await Promise.all([loadRoute(trip), loadWeather(trip)])
}

const loadRoute = async (trip: Trip) => {
  if (!map) return
  loadingHistory.value = true

  // Clear previous layers
  if (routeLine) { map.removeLayer(routeLine); routeLine = null }
  if (startMarker) { map.removeLayer(startMarker); startMarker = null }
  if (endMarker) { map.removeLayer(endMarker); endMarker = null }

  try {
    const from = trip.StartTime.replace(' ', 'T')
    const to = trip.FinishTime.replace(' ', 'T')
    const history = await apiClient.getHistory(trip.vehicleCode!, from, to)

    const vehicleHistory = history.find((h: any) => h.VehicleCode === trip.vehicleCode) || history[0]
    const positions = vehicleHistory?.Positions || []

    if (positions.length > 1) {
      const latlngs: L.LatLngExpression[] = positions.map((p: any) => [parseFloat(p.Lat), parseFloat(p.Lng)])
      routeLine = L.polyline(latlngs, { color: '#3B82F6', weight: 3, opacity: 0.85 }).addTo(map)
      map.fitBounds(routeLine.getBounds(), { padding: [40, 40] })
    } else {
      // Fall back to drawing a straight line from start to finish
      const s = trip.StartPosition
      const f = trip.FinishPosition
      if (s && f) {
        const latlngs: L.LatLngExpression[] = [
          [parseFloat(s.Latitude), parseFloat(s.Longitude)],
          [parseFloat(f.Latitude), parseFloat(f.Longitude)]
        ]
        routeLine = L.polyline(latlngs, { color: '#3B82F6', weight: 2, opacity: 0.5, dashArray: '6,6' }).addTo(map)
        map.fitBounds(routeLine.getBounds(), { padding: [60, 60] })
      }
    }

    // Start / end markers
    const sp = trip.StartPosition
    const fp = trip.FinishPosition
    if (sp) {
      startMarker = L.marker([parseFloat(sp.Latitude), parseFloat(sp.Longitude)], { icon: pinIcon('#22C55E') })
        .bindPopup(`<b>Start</b><br>${trip.StartAddress || 'Unknown'}`)
        .addTo(map)
    }
    if (fp) {
      endMarker = L.marker([parseFloat(fp.Latitude), parseFloat(fp.Longitude)], { icon: pinIcon('#EF4444') })
        .bindPopup(`<b>End</b><br>${trip.FinishAddress || 'Unknown'}`)
        .addTo(map)
    }
  } catch (e) {
    console.error('Failed to load route history', e)
  } finally {
    loadingHistory.value = false
  }
}

const loadWeather = async (trip: Trip) => {
  loadingWeather.value = true
  try {
    const startDate = trip.StartTime.slice(0, 10)
    const endDate = trip.FinishTime.slice(0, 10)
    const sp = trip.StartPosition
    const fp = trip.FinishPosition

    const [wStart, wEnd] = await Promise.all([
      sp ? apiClient.getWeather(parseFloat(sp.Latitude), parseFloat(sp.Longitude), startDate, startDate) : null,
      fp ? apiClient.getWeather(parseFloat(fp.Latitude), parseFloat(fp.Longitude), endDate, endDate) : null
    ])

    // Extract the hour closest to departure/arrival time
    weatherStart.value = extractHourlyWeather(wStart, trip.StartTime)
    weatherEnd.value = extractHourlyWeather(wEnd, trip.FinishTime)
  } catch (e) {
    console.error('Failed to load weather', e)
  } finally {
    loadingWeather.value = false
  }
}

const extractHourlyWeather = (data: any, isoTime: string) => {
  if (!data?.hourly) return null
  const hour = new Date(isoTime).getHours()
  const idx = data.hourly.time?.findIndex((t: string) => new Date(t).getHours() === hour) ?? -1
  if (idx < 0) return null
  return {
    temp: data.hourly.temperature_2m?.[idx] ?? null,
    precipitation: data.hourly.precipitation?.[idx] ?? null,
  }
}

const switchToMap = () => {
  mobileTab.value = 'map'
  nextTick(() => map?.invalidateSize())
}

const weatherIcon = (precip: number | null) => {
  if (precip === null) return '—'
  if (precip > 5) return 'Heavy rain'
  if (precip > 1) return 'Light rain'
  if (precip > 0) return 'Drizzle'
  return 'Clear'
}
</script>

<template>
  <div class="flex flex-col min-h-0 w-full bg-dark-bg overflow-hidden" style="height:100%">

    <!-- Mobile tab switcher -->
    <div class="md:hidden flex-shrink-0 flex border-b border-gray-800 bg-dark-card">
      <button
        @click="mobileTab = 'list'"
        :class="['flex-1 py-3 text-sm font-medium transition-colors border-b-2', mobileTab === 'list' ? 'text-blue-400 border-blue-500' : 'text-gray-500 border-transparent']"
      >Trips</button>
      <button
        @click="switchToMap"
        :class="['flex-1 py-3 text-sm font-medium transition-colors border-b-2', mobileTab === 'map' ? 'text-blue-400 border-blue-500' : 'text-gray-500 border-transparent']"
      >{{ selectedTrip ? 'Route' : 'Map' }}</button>
    </div>

    <div class="flex flex-1 min-h-0 overflow-hidden">

      <!-- Trip List Panel: full-width on mobile (tab), fixed sidebar on desktop -->
      <div
        :class="[
          'bg-dark-card border-gray-800 flex flex-col flex-shrink-0',
          'md:w-88 md:border-r md:flex',
          mobileTab === 'list' ? 'flex w-full' : 'hidden'
        ]"
      >
        <div class="p-3 border-b border-gray-800 space-y-2 flex-shrink-0">
          <h2 class="text-xs font-bold text-white tracking-wider uppercase">Trip Inspector</h2>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search driver, vehicle or location..."
            class="w-full bg-gray-900 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />
          <select
            v-model="filterDriver"
            class="w-full bg-gray-900 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Drivers</option>
            <option v-for="d in uniqueDrivers" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>

        <div v-if="store.loadingTrips" class="flex-1 flex items-center justify-center">
          <div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>

        <div v-else class="flex-1 overflow-y-auto">
          <div
            v-for="trip in filteredTrips" :key="trip.Id"
            @click="selectTrip(trip)"
            :class="[
              'p-4 border-b border-gray-800/60 cursor-pointer transition-colors active:bg-gray-800/50',
              selectedTrip?.Id === trip.Id ? 'bg-blue-600/10 border-l-2 border-l-blue-500' : 'hover:bg-gray-800/40'
            ]"
          >
            <div class="flex items-start justify-between gap-2 mb-1">
              <div class="text-sm font-semibold text-gray-100 truncate">{{ trip.vehicleName }}</div>
              <div class="text-xs text-gray-500 flex-shrink-0">{{ formatDate(trip.StartTime) }}</div>
            </div>
            <div class="text-xs text-gray-400 truncate">
              {{ trip.StartAddress?.split(',')[0] || '?' }}
              <span class="text-gray-600 mx-1">→</span>
              {{ trip.FinishAddress?.split(',')[0] || '?' }}
            </div>
            <div class="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
              <span class="truncate">{{ trip.DriverName || 'Unknown' }}</span>
              <span>·</span>
              <span class="flex-shrink-0">{{ Math.round(Number(trip.TotalDistance) || 0) }} km</span>
              <span>·</span>
              <span class="flex-shrink-0">{{ trip.TripLength }}</span>
            </div>
          </div>
          <div v-if="filteredTrips.length === 0" class="p-8 text-center text-gray-500 text-sm">
            No trips match your filter.
          </div>
        </div>
      </div>

      <!-- Map + Detail Panel -->
      <div
        :class="[
          'flex-1 flex flex-col min-w-0 min-h-0',
          mobileTab === 'map' ? 'flex' : 'hidden md:flex'
        ]"
      >
        <!-- Map -->
        <div class="flex-1 relative min-h-0">
          <div id="trip-map" style="position:absolute;inset:0;width:100%;height:100%"></div>

          <div v-if="loadingHistory" class="absolute inset-0 z-10 flex items-center justify-center bg-dark-bg/70" style="-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)">
            <div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>

          <div v-if="!selectedTrip && !loadingHistory" class="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div class="bg-dark-card/90 border border-gray-800 rounded-xl px-6 py-5 text-center mx-4">
              <p class="text-gray-400 text-sm">Select a trip to view its route.</p>
            </div>
          </div>
        </div>

        <!-- Trip detail strip -->
        <div v-if="selectedTrip" class="flex-shrink-0 bg-dark-card border-t border-gray-800 p-3">
          <!-- Route header -->
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-gray-100 truncate">
                {{ selectedTrip.StartAddress?.split(',')[0] || '—' }}
                <span class="text-gray-600 mx-1 font-normal">→</span>
                {{ selectedTrip.FinishAddress?.split(',')[0] || '—' }}
              </div>
              <div class="text-xs text-gray-400 mt-0.5">
                {{ selectedTrip.DriverName || 'Unknown' }} · {{ selectedTrip.vehicleName }} · {{ formatDate(selectedTrip.StartTime) }}
              </div>
            </div>
          </div>

          <!-- Stats + weather row -->
          <div class="flex items-center gap-4 overflow-x-auto">
            <div class="text-center flex-shrink-0">
              <div class="text-base font-bold text-white leading-none">{{ Math.round(Number(selectedTrip.TotalDistance) || 0) }}</div>
              <div class="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">km</div>
            </div>
            <div class="text-center flex-shrink-0">
              <div class="text-base font-bold text-white leading-none">{{ selectedTrip.TripLength || '—' }}</div>
              <div class="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">duration</div>
            </div>
            <div class="text-center flex-shrink-0">
              <div class="text-base font-bold text-white leading-none">{{ Math.round(Number(selectedTrip.AverageSpeed) || 0) }}</div>
              <div class="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">avg km/h</div>
            </div>
            <div class="text-center flex-shrink-0">
              <div class="text-base font-bold text-white leading-none">{{ (Number(selectedTrip.FuelConsumed?.Value) || 0).toFixed(1) }}</div>
              <div class="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">litres</div>
            </div>
            <div class="text-center flex-shrink-0">
              <div class="text-base font-bold text-white leading-none">{{ Math.round(Number(selectedTrip.TripCost?.Value) || 0) }}</div>
              <div class="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">CZK</div>
            </div>

            <div class="ml-auto flex gap-2 flex-shrink-0">
              <div v-if="loadingWeather" class="flex items-center gap-1.5 text-xs text-gray-500">
                <div class="animate-spin w-3 h-3 border border-blue-500 border-t-transparent rounded-full"></div>
                Weather...
              </div>
              <template v-else>
                <div v-if="weatherStart" class="bg-gray-800/60 rounded-lg px-2.5 py-1.5 text-center">
                  <div class="text-[9px] text-gray-500 uppercase tracking-wider">Dep.</div>
                  <div class="text-xs font-bold text-white">{{ weatherStart.temp !== null ? weatherStart.temp + '°C' : '—' }}</div>
                  <div class="text-[9px] text-gray-400">{{ weatherIcon(weatherStart.precipitation) }}</div>
                </div>
                <div v-if="weatherEnd" class="bg-gray-800/60 rounded-lg px-2.5 py-1.5 text-center">
                  <div class="text-[9px] text-gray-500 uppercase tracking-wider">Arr.</div>
                  <div class="text-xs font-bold text-white">{{ weatherEnd.temp !== null ? weatherEnd.temp + '°C' : '—' }}</div>
                  <div class="text-[9px] text-gray-400">{{ weatherIcon(weatherEnd.precipitation) }}</div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Spacer for mobile bottom nav -->
    <div class="md:hidden flex-shrink-0" style="height:calc(60px + env(safe-area-inset-bottom, 0px))"></div>
  </div>
</template>
