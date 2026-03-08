<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFleetStore, type DriverStat, type Trip } from '../stores/fleet'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'

const store = useFleetStore()
const router = useRouter()

type SortKey = 'avgEfficiency' | 'totalDistance' | 'tripCount' | 'totalCost'
const sortKey = ref<SortKey>('avgEfficiency')
const selectedDriver = ref<DriverStat | null>(null)

const sortOptions: { label: string; value: SortKey }[] = [
  { label: 'Fuel Efficiency', value: 'avgEfficiency' },
  { label: 'Distance', value: 'totalDistance' },
  { label: 'Trips', value: 'tripCount' },
  { label: 'Total Cost', value: 'totalCost' },
]

onMounted(async () => {
  if (store.allTrips.length === 0) {
    await store.fetchAllTrips()
  }
  if (rankedDrivers.value.length > 0) {
    selectedDriver.value = rankedDrivers.value[0] ?? null
  }
})

const rankedDrivers = computed(() => {
  const sorted = [...store.driverStats].sort((a, b) => {
    if (sortKey.value === 'avgEfficiency') {
      // Lower L/100km is better, but filter out 0s to end
      if (a.avgEfficiency === 0) return 1
      if (b.avgEfficiency === 0) return -1
      return a.avgEfficiency - b.avgEfficiency
    }
    return (b[sortKey.value] as number) - (a[sortKey.value] as number)
  })
  return sorted
})

const efficiencyBadge = (l100: number) => {
  if (l100 <= 0) return { text: 'No Data', cls: 'bg-gray-800 text-gray-500' }
  if (l100 < 8) return { text: 'Excellent', cls: 'bg-status-green/15 text-status-green' }
  if (l100 < 12) return { text: 'Average', cls: 'bg-status-yellow/15 text-status-yellow' }
  return { text: 'High Usage', cls: 'bg-status-red/15 text-status-red' }
}

const initials = (name: string) =>
  name.split(/[\s,]+/).filter(p => p.length > 0).slice(0, 2).map(p => p[0]!.toUpperCase()).join('')

const selectDriver = (d: DriverStat) => {
  selectedDriver.value = d
}

const driverRecentTrips = computed(() =>
  (selectedDriver.value?.trips || []).slice(0, 6)
)

const formatDuration = (trip: Trip) => trip.TripLength?.trim() || '—'

const formatDate = (iso: string) => {
  try { return format(new Date(iso), 'MMM d, HH:mm') } catch { return iso }
}
</script>

<template>
  <div class="p-4 md:p-6 h-full overflow-y-auto bg-dark-bg pb-[calc(60px+env(safe-area-inset-bottom,0px))] md:pb-6">
    <div class="max-w-7xl mx-auto space-y-6">

      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Driver Leaderboard</h1>
          <p class="text-gray-400 text-sm mt-0.5">Ranked by fuel efficiency across the last {{ store.dateRange }} days.</p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="opt in sortOptions" :key="opt.value"
            @click="sortKey = opt.value"
            :class="[
              'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
              sortKey === opt.value
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                : 'bg-dark-card text-gray-400 border-transparent hover:text-gray-200'
            ]"
          >{{ opt.label }}</button>
        </div>
      </header>

      <div v-if="store.loadingTrips" class="flex flex-col items-center justify-center py-32 gap-4">
        <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <p class="text-gray-500 text-sm">Loading driver data...</p>
      </div>

      <div v-else-if="rankedDrivers.length === 0" class="flex items-center justify-center py-32">
        <p class="text-gray-500 text-sm">No driver data found for the selected period.</p>
      </div>

      <div v-else class="flex flex-col lg:flex-row gap-6">

        <!-- Leaderboard List -->
        <div class="lg:w-1/2 space-y-3">
          <div
            v-for="(driver, idx) in rankedDrivers" :key="driver.name"
            @click="selectDriver(driver)"
            :class="[
              'bg-dark-card border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all',
              selectedDriver?.name === driver.name
                ? 'border-blue-500/50 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]'
                : 'border-gray-800 hover:border-gray-700'
            ]"
          >
            <div class="w-7 text-center text-sm font-bold text-gray-500">{{ idx + 1 }}</div>
            <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-sm text-gray-200 flex-shrink-0">
              {{ initials(driver.name) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-gray-100 truncate">{{ driver.name }}</div>
              <div class="text-xs text-gray-500 mt-0.5">
                {{ Math.round(Number(driver.totalDistance) || 0).toLocaleString() }} km
                · {{ (Number(driver.totalFuel) || 0).toFixed(0) }} L
                · {{ driver.tripCount }} trips
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <span :class="['inline-block px-2 py-0.5 rounded text-xs font-semibold', efficiencyBadge(driver.avgEfficiency).cls]">
                {{ (Number(driver.avgEfficiency) || 0) > 0 ? (Number(driver.avgEfficiency)).toFixed(1) + ' L/100km' : 'No Data' }}
              </span>
              <div class="text-xs text-gray-600 mt-1">{{ efficiencyBadge(driver.avgEfficiency).text }}</div>
            </div>
          </div>
        </div>

        <!-- Driver Detail Panel -->
        <div class="lg:w-1/2">
          <div v-if="selectedDriver" class="sticky top-6 bg-dark-card border border-gray-800 rounded-xl overflow-hidden">
            <!-- Header -->
            <div class="p-5 border-b border-gray-800 flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-lg">
                {{ initials(selectedDriver.name) }}
              </div>
              <div>
                <div class="text-lg font-bold text-white">{{ selectedDriver.name }}</div>
                <div :class="['text-sm font-medium', efficiencyBadge(selectedDriver.avgEfficiency).cls]">
                  {{ efficiencyBadge(selectedDriver.avgEfficiency).text }}
                  — {{ (Number(selectedDriver.avgEfficiency) || 0) > 0 ? (Number(selectedDriver.avgEfficiency)).toFixed(1) + ' L/100km avg' : 'No fuel data' }}
                </div>
              </div>
            </div>

            <!-- Stat Grid -->
            <div class="grid grid-cols-2 gap-px bg-gray-800">
              <div class="bg-dark-card p-4">
                <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Trips</div>
                <div class="text-xl font-bold text-white">{{ selectedDriver.tripCount }}</div>
              </div>
              <div class="bg-dark-card p-4">
                <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Distance</div>
                <div class="text-xl font-bold text-white">{{ Math.round(Number(selectedDriver.totalDistance) || 0).toLocaleString() }} <span class="text-sm font-normal text-gray-500">km</span></div>
              </div>
              <div class="bg-dark-card p-4">
                <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Fuel Consumed</div>
                <div class="text-xl font-bold text-white">{{ (Number(selectedDriver.totalFuel) || 0).toFixed(0) }} <span class="text-sm font-normal text-gray-500">L</span></div>
              </div>
              <div class="bg-dark-card p-4">
                <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Cost</div>
                <div class="text-xl font-bold text-white">{{ Math.round(Number(selectedDriver.totalCost) || 0).toLocaleString() }} <span class="text-sm font-normal text-gray-500">CZK</span></div>
              </div>
            </div>

            <!-- Recent Trips -->
            <div class="p-5">
              <h4 class="text-xs text-gray-500 uppercase tracking-wider mb-3">Recent Trips</h4>
              <div class="space-y-2">
                <div
                  v-for="trip in driverRecentTrips" :key="trip.Id"
                  class="flex items-center justify-between text-sm py-2 border-b border-gray-800/60 cursor-pointer hover:text-white transition-colors"
                  @click="router.push({ name: 'trips', query: { tripId: trip.Id, vehicleCode: trip.vehicleCode } })"
                >
                  <div class="flex-1 min-w-0">
                    <div class="text-gray-200 truncate">
                      {{ trip.StartAddress?.split(',')[0] || 'Unknown' }}
                      <span class="text-gray-600 mx-1">→</span>
                      {{ trip.FinishAddress?.split(',')[0] || 'Unknown' }}
                    </div>
                    <div class="text-xs text-gray-500 mt-0.5">{{ formatDate(trip.StartTime) }} · {{ formatDuration(trip) }} · {{ Math.round(Number(trip.TotalDistance) || 0) }} km</div>
                  </div>
                  <div class="text-gray-400 ml-4 flex-shrink-0">{{ Math.round(Number(trip.TripCost?.Value) || 0) }} CZK</div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="sticky top-6 bg-dark-card border border-gray-800 rounded-xl p-10 flex items-center justify-center min-h-[200px]">
            <p class="text-gray-500 text-sm">Select a driver to view details.</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
