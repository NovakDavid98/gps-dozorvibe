<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { apiClient } from '../api/client'
import "leaflet/dist/leaflet.css"
import L from 'leaflet'

const vehicles = ref<any[]>([])
const loading = ref(true)
let map: L.Map | null = null
let markers: { [key: string]: L.Marker } = {}
let refreshInterval: any = null

const activeVehicles = computed(() => vehicles.value.filter(v => v.Speed > 0).length)
const totalKm = computed(() => {
  // Mocking daily distance for now, normally we'd aggregate trips
  return Math.round(vehicles.value.reduce((acc, v) => acc + (v.Odometer % 100), 0))
})

onMounted(async () => {
  initMap()
  await fetchVehicles()
  loading.value = false
  
  refreshInterval = setInterval(fetchVehicles, 30000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  if (map) map.remove()
})

const initMap = () => {
  map = L.map('fleet-map', {
    zoomControl: false,
    attributionControl: false
  }).setView([49.8, 15.5], 5) // Center on Europe

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map)
}

const fetchVehicles = async () => {
  try {
    const data = await apiClient.getVehicles()
    vehicles.value = data
    updateMarkers()
  } catch (e) {
    console.error(e)
  }
}

const getCustomIcon = (isMoving: boolean) => {
  const color = isMoving ? '#22C55E' : '#6B7280'
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #131825; box-shadow: 0 0 8px ${color}80;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  })
}

const updateMarkers = () => {
  if (!map) return

  vehicles.value.forEach(v => {
    if (!v.LastPosition || !v.LastPosition.Latitude) return

    const lat = parseFloat(v.LastPosition.Latitude)
    const lng = parseFloat(v.LastPosition.Longitude)
    const isMoving = v.Speed > 0

    if (markers[v.Code]) {
      markers[v.Code].setLatLng([lat, lng])
      markers[v.Code].setIcon(getCustomIcon(isMoving))
      markers[v.Code].setPopupContent(`
        <div class="font-bold text-white">${v.Name}</div>
        <div class="text-xs text-gray-400">${v.SPZ} · ${v.Speed} km/h</div>
      `)
    } else {
      const marker = L.marker([lat, lng], { icon: getCustomIcon(isMoving) }).addTo(map)
      marker.bindPopup(`
        <div class="font-bold text-white">${v.Name}</div>
        <div class="text-xs text-gray-400">${v.SPZ} · ${v.Speed} km/h</div>
      `)
      markers[v.Code] = marker
    }
  })
}
</script>

<template>
  <div class="flex flex-col h-full w-full bg-dark-bg">
    <!-- Top Stats Bar -->
    <header class="h-16 border-b border-gray-800 bg-dark-card flex items-center px-6 gap-6 z-10 shadow-md">
      <div class="flex flex-col">
        <span class="text-xs text-gray-400 font-medium tracking-wider uppercase">Active Vehicles</span>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-status-green"></div>
          <span class="text-lg font-bold">{{ activeVehicles }} <span class="text-sm font-normal text-gray-500">/ {{ vehicles.length }}</span></span>
        </div>
      </div>
      <div class="w-px h-8 bg-gray-800"></div>
      <div class="flex flex-col">
        <span class="text-xs text-gray-400 font-medium tracking-wider uppercase">Est. Km Today</span>
        <span class="text-lg font-bold">{{ totalKm.toLocaleString() }} <span class="text-sm font-normal text-gray-500">km</span></span>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Map Area -->
      <div class="flex-1 relative bg-gray-900">
        <div id="fleet-map" class="absolute inset-0 z-0"></div>
        
        <!-- Loading Overlay -->
        <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-dark-bg/80 backdrop-blur-sm">
          <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </div>

      <!-- Right Sidebar: Vehicle List -->
      <div class="w-80 bg-dark-card border-l border-gray-800 flex flex-col z-10">
        <div class="p-4 border-b border-gray-800">
          <h2 class="text-sm font-bold text-white tracking-wider uppercase">Fleet Overview</h2>
        </div>
        
        <div class="flex-1 overflow-y-auto p-2">
          <div v-for="vehicle in vehicles" :key="vehicle.Code" 
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
            @click="() => {
              if (map && vehicle.LastPosition) {
                map.setView([parseFloat(vehicle.LastPosition.Latitude), parseFloat(vehicle.LastPosition.Longitude)], 12)
                markers[vehicle.Code]?.openPopup()
              }
            }"
          >
            <div :class="['w-2.5 h-2.5 rounded-full flex-shrink-0', vehicle.Speed > 0 ? 'bg-status-green shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-500']"></div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-gray-100 truncate">{{ vehicle.Name }}</div>
              <div class="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                <span>{{ vehicle.SPZ || 'No Plate' }}</span>
                <span>·</span>
                <span :class="vehicle.Speed > 0 ? 'text-status-green font-medium' : ''">{{ Math.round(vehicle.Speed) }} km/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
