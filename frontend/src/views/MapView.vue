<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { apiClient } from '../api/client'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const vehicles = ref<any[]>([])
const loading = ref(true)
const listOpen = ref(false)
let map: L.Map | null = null
let markers: { [key: string]: L.Marker } = {}
let refreshInterval: ReturnType<typeof setInterval> | null = null

const activeVehicles = computed(() => vehicles.value.filter(v => v.Speed > 0).length)

onMounted(async () => {
  // Wait for the DOM to fully render before initialising Leaflet.
  // On iOS Safari this is critical — the map div must have a resolved
  // pixel height before L.map() is called, otherwise Leaflet measures
  // 0x0 and renders nothing.
  await nextTick()

  initMap()
  await fetchVehicles()
  loading.value = false

  // invalidateSize forces Leaflet to re-measure the container after Vue
  // finishes painting. Fixes the blank-map issue on Safari / WebKit.
  await nextTick()
  map?.invalidateSize()

  refreshInterval = setInterval(fetchVehicles, 30000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  if (map) map.remove()
})

const initMap = () => {
  // tap: false prevents Leaflet's tap handler conflicting with Safari
  // touch events. Cast to any because @types/leaflet omits this option.
  map = L.map('fleet-map', {
    zoomControl: false,
    attributionControl: false,
    ...(({ tap: false }) as any),
  } as L.MapOptions).setView([49.8, 15.5], 5)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    // detectRetina improves tile quality on high-DPI mobile screens
    detectRetina: true,
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
    // Larger hit area on mobile: 16px dot
    html: `<div style="background-color:${color};width:14px;height:14px;border-radius:50%;border:2px solid #131825;box-shadow:0 0 8px ${color}80;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

const focusVehicle = (vehicle: any) => {
  if (!map || !vehicle.LastPosition) return
  map.setView(
    [parseFloat(vehicle.LastPosition.Latitude), parseFloat(vehicle.LastPosition.Longitude)],
    12
  )
  markers[vehicle.Code]?.openPopup()
  // Close the drawer after selecting a vehicle on mobile
  listOpen.value = false
}

const updateMarkers = () => {
  if (!map) return
  const activeMap = map

  vehicles.value.forEach(v => {
    if (!v.LastPosition?.Latitude) return

    const lat = parseFloat(v.LastPosition.Latitude)
    const lng = parseFloat(v.LastPosition.Longitude)
    const isMoving = v.Speed > 0
    const existing = markers[v.Code]

    if (existing) {
      existing.setLatLng([lat, lng])
      existing.setIcon(getCustomIcon(isMoving))
      existing.setPopupContent(popupHtml(v))
    } else {
      const marker = L.marker([lat, lng], { icon: getCustomIcon(isMoving) }).addTo(activeMap)
      marker.bindPopup(popupHtml(v))
      markers[v.Code] = marker
    }
  })
}

const popupHtml = (v: any) =>
  `<div style="font-weight:600;color:#f1f5f9">${v.Name}</div>
   <div style="font-size:12px;color:#94a3b8;margin-top:2px">${v.SPZ || '—'} · ${Math.round(v.Speed)} km/h</div>`
</script>

<template>
  <!--
    Full-height flex column.
    On mobile we need padding-bottom to avoid the map being hidden
    behind the fixed bottom tab bar (approx 60px + safe-area).
  -->
  <div class="flex flex-col min-h-0 w-full bg-dark-bg" style="height:100%">

    <!-- Stats header -->
    <header class="flex-shrink-0 h-14 border-b border-gray-800 bg-dark-card flex items-center px-4 gap-5 z-10 shadow-md">
      <div class="flex flex-col">
        <span class="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Active</span>
        <div class="flex items-center gap-1.5">
          <div class="w-1.5 h-1.5 rounded-full bg-status-green"></div>
          <span class="text-base font-bold leading-none">
            {{ activeVehicles }}
            <span class="text-xs font-normal text-gray-500">/ {{ vehicles.length }}</span>
          </span>
        </div>
      </div>
      <div class="w-px h-7 bg-gray-800"></div>
      <div class="flex flex-col">
        <span class="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Vehicles</span>
        <span class="text-base font-bold leading-none">{{ vehicles.length }}</span>
      </div>

      <!-- Mobile: toggle vehicle list button -->
      <button
        class="md:hidden ml-auto flex items-center gap-1.5 text-xs text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-1.5 transition-colors"
        @click="listOpen = !listOpen"
      >
        <span>{{ listOpen ? 'Hide' : 'Fleet' }}</span>
        <svg class="w-3 h-3 transition-transform duration-200" :class="listOpen ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </button>
    </header>

    <!-- Content row: map + (desktop) right panel -->
    <div class="flex flex-1 min-h-0 relative">

      <!-- Map container: flex-1 so it always fills available space.
           The explicit height:100% on the inner div is the Safari fix —
           Leaflet needs the container to have a resolved pixel height. -->
      <div class="flex-1 relative min-w-0">
        <div id="fleet-map" style="position:absolute;inset:0;width:100%;height:100%"></div>

        <!-- Loading overlay -->
        <div
          v-if="loading"
          class="absolute inset-0 z-10 flex items-center justify-center bg-dark-bg/80"
          style="-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)"
        >
          <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </div>

      <!-- Desktop right sidebar: vehicle list -->
      <div class="hidden md:flex w-72 lg:w-80 bg-dark-card border-l border-gray-800 flex-col flex-shrink-0 z-10">
        <div class="p-4 border-b border-gray-800 flex-shrink-0">
          <h2 class="text-xs font-bold text-white tracking-wider uppercase">Fleet Overview</h2>
        </div>
        <div class="flex-1 overflow-y-auto p-2">
          <div
            v-for="vehicle in vehicles"
            :key="vehicle.Code"
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
            @click="focusVehicle(vehicle)"
          >
            <div :class="['w-2.5 h-2.5 rounded-full flex-shrink-0', vehicle.Speed > 0 ? 'bg-status-green shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-gray-600']"></div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-gray-100 truncate">{{ vehicle.Name }}</div>
              <div class="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <span class="truncate">{{ vehicle.SPZ || 'No Plate' }}</span>
                <span>·</span>
                <span :class="vehicle.Speed > 0 ? 'text-status-green font-medium' : ''">{{ Math.round(vehicle.Speed) }} km/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile: vehicle list drawer (slides up over the map) -->
      <transition name="drawer">
        <div
          v-if="listOpen"
          class="md:hidden absolute bottom-0 left-0 right-0 z-20 bg-dark-card border-t border-gray-800 rounded-t-2xl"
          style="max-height:55%"
        >
          <div class="flex justify-center pt-2 pb-1">
            <div class="w-10 h-1 rounded-full bg-gray-700"></div>
          </div>
          <div class="px-3 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Fleet Overview</div>
          <div class="overflow-y-auto pb-2" style="max-height:calc(55vh - 56px)">
            <div
              v-for="vehicle in vehicles"
              :key="vehicle.Code"
              class="flex items-center gap-3 px-4 py-3 border-b border-gray-800/60 cursor-pointer active:bg-gray-800/60 transition-colors"
              @click="focusVehicle(vehicle)"
            >
              <div :class="['w-2.5 h-2.5 rounded-full flex-shrink-0', vehicle.Speed > 0 ? 'bg-status-green' : 'bg-gray-600']"></div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-gray-100 truncate">{{ vehicle.Name }}</div>
                <div class="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                  <span>{{ vehicle.SPZ || '—' }}</span>
                  <span>·</span>
                  <span :class="vehicle.Speed > 0 ? 'text-status-green font-medium' : ''">{{ Math.round(vehicle.Speed) }} km/h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

    </div>

    <!-- Spacer for mobile bottom nav bar -->
    <div class="md:hidden flex-shrink-0" style="height:calc(60px + env(safe-area-inset-bottom, 0px))"></div>
  </div>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.25s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateY(100%);
}
</style>
