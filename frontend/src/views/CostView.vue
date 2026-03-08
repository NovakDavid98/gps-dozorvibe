<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { useFleetStore } from '../stores/fleet'
import { useRouter } from 'vue-router'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

const store = useFleetStore()
const router = useRouter()

const RANGE_OPTIONS = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 14 Days', value: 14 },
  { label: 'Last 30 Days', value: 30 },
]
const selectedRange = ref(7)

onMounted(async () => {
  if (store.allTrips.length === 0) {
    await store.fetchAllTrips()
  }
})

watch(selectedRange, val => store.setDateRange(val))

const efficiencyLabel = (l100: number) => {
  if (l100 <= 0) return null
  if (l100 < 8) return { text: 'Excellent', cls: 'bg-status-green/15 text-status-green' }
  if (l100 < 12) return { text: 'Average', cls: 'bg-status-yellow/15 text-status-yellow' }
  return { text: 'High', cls: 'bg-status-red/15 text-status-red' }
}

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: {} } },
  scales: {
    x: { grid: { color: '#1f2937' }, ticks: { color: '#6b7280', font: { size: 11 } } },
    y: { grid: { color: '#1f2937' }, ticks: { color: '#6b7280', font: { size: 11 } } }
  }
}

const dailyCostChartData = computed(() => ({
  labels: store.dailyCostData.map(d => d.date),
  datasets: [{
    data: store.dailyCostData.map(d => Math.round(d.cost)),
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59,130,246,0.12)',
    fill: true,
    tension: 0.4,
    pointBackgroundColor: '#3B82F6',
    pointRadius: 4,
    pointHoverRadius: 6,
  }]
}))

const dailyCostOptions = computed(() => ({
  ...chartDefaults,
  plugins: {
    ...chartDefaults.plugins,
    tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.parsed.y.toLocaleString()} CZK` } }
  }
}))

const vehicleCostChartData = computed(() => ({
  labels: store.vehicleCostData.slice(0, 10).map(v => v.name),
  datasets: [{
    data: store.vehicleCostData.slice(0, 10).map(v => Math.round(v.cost)),
    backgroundColor: store.vehicleCostData.slice(0, 10).map((_, i) =>
      `rgba(59,130,246,${1 - i * 0.07})`
    ),
    borderRadius: 4,
    borderSkipped: false,
  }]
}))

const vehicleCostOptions = computed(() => ({
  ...chartDefaults,
  indexAxis: 'y' as const,
  plugins: {
    ...chartDefaults.plugins,
    tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.parsed.x.toLocaleString()} CZK` } }
  }
}))

const tableRows = computed(() =>
  store.vehicleCostData.map((v, i) => ({
    rank: i + 1,
    name: v.name,
    distance: Math.round(v.distance),
    fuel: v.fuel.toFixed(1),
    cost: Math.round(v.cost),
    l100: v.efficiency.toFixed(1),
    effLabel: efficiencyLabel(v.efficiency)
  }))
)
</script>

<template>
  <div class="p-4 md:p-6 h-full overflow-y-auto bg-dark-bg pb-[calc(60px+env(safe-area-inset-bottom,0px))] md:pb-6">
    <div class="max-w-7xl mx-auto space-y-6">

      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Cost & Efficiency</h1>
          <p class="text-gray-400 text-sm mt-0.5">Fleet expenditure and fuel consumption breakdown.</p>
        </div>
        <div class="flex gap-2">
          <button
            v-for="opt in RANGE_OPTIONS" :key="opt.value"
            @click="selectedRange = opt.value"
            :class="[
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
              selectedRange === opt.value
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                : 'bg-dark-card text-gray-400 border-transparent hover:text-gray-200'
            ]"
          >{{ opt.label }}</button>
        </div>
      </header>

      <!-- Loading state -->
      <div v-if="store.loadingTrips" class="flex flex-col items-center justify-center py-32 gap-4">
        <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <p class="text-gray-500 text-sm">Fetching trip data for all vehicles...</p>
      </div>

      <template v-else-if="store.allTrips.length === 0">
        <div class="flex items-center justify-center py-32">
          <p class="text-gray-500 text-sm">No trip data found for the selected period.</p>
        </div>
      </template>

      <template v-else>
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-dark-card border border-gray-800 rounded-xl p-5">
            <div class="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Total Cost</div>
            <div class="text-2xl font-bold text-white">
              {{ Math.round(store.totalCost).toLocaleString() }}
              <span class="text-base font-normal text-gray-500"> CZK</span>
            </div>
          </div>
          <div class="bg-dark-card border border-gray-800 rounded-xl p-5">
            <div class="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Total Fuel</div>
            <div class="text-2xl font-bold text-white">
              {{ Math.round(store.totalFuel).toLocaleString() }}
              <span class="text-base font-normal text-gray-500"> L</span>
            </div>
          </div>
          <div class="bg-dark-card border border-gray-800 rounded-xl p-5">
            <div class="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Total Distance</div>
            <div class="text-2xl font-bold text-white">
              {{ Math.round(store.totalDistance).toLocaleString() }}
              <span class="text-base font-normal text-gray-500"> km</span>
            </div>
          </div>
          <div class="bg-dark-card border border-gray-800 rounded-xl p-5">
            <div class="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Fleet Avg Efficiency</div>
            <div :class="['text-2xl font-bold', store.fleetEfficiency < 8 ? 'text-status-green' : store.fleetEfficiency < 12 ? 'text-status-yellow' : 'text-status-red']">
              {{ store.fleetEfficiency.toFixed(1) }}
              <span class="text-base font-normal text-gray-500"> L/100km</span>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-dark-card border border-gray-800 rounded-xl p-5">
            <h3 class="text-sm font-semibold text-gray-300 mb-4">Daily Fleet Cost (CZK)</h3>
            <div class="h-52">
              <Line :data="dailyCostChartData" :options="dailyCostOptions" />
            </div>
          </div>
          <div class="bg-dark-card border border-gray-800 rounded-xl p-5">
            <h3 class="text-sm font-semibold text-gray-300 mb-4">Cost by Vehicle (CZK)</h3>
            <div class="h-52">
              <Bar :data="vehicleCostChartData" :options="vehicleCostOptions" />
            </div>
          </div>
        </div>

        <!-- Efficiency Table -->
        <div class="bg-dark-card border border-gray-800 rounded-xl overflow-hidden">
          <div class="p-5 border-b border-gray-800">
            <h3 class="text-sm font-semibold text-gray-300">Efficiency Ranking</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-800">
                  <th class="text-left py-3 px-4 text-xs text-gray-500 font-medium uppercase tracking-wider w-12">#</th>
                  <th class="text-left py-3 px-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Vehicle</th>
                  <th class="text-right py-3 px-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Distance</th>
                  <th class="text-right py-3 px-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Fuel</th>
                  <th class="text-right py-3 px-4 text-xs text-gray-500 font-medium uppercase tracking-wider">Cost</th>
                  <th class="text-center py-3 px-4 text-xs text-gray-500 font-medium uppercase tracking-wider">L/100km</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in tableRows" :key="row.rank"
                  class="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors cursor-pointer"
                  @click="router.push('/trips')"
                >
                  <td class="py-3 px-4 text-gray-500 font-medium">{{ row.rank }}</td>
                  <td class="py-3 px-4 text-gray-100 font-medium">{{ row.name }}</td>
                  <td class="py-3 px-4 text-gray-300 text-right">{{ row.distance.toLocaleString() }} km</td>
                  <td class="py-3 px-4 text-gray-300 text-right">{{ row.fuel }} L</td>
                  <td class="py-3 px-4 text-gray-300 text-right">{{ row.cost.toLocaleString() }} CZK</td>
                  <td class="py-3 px-4 text-center">
                    <span v-if="row.effLabel" :class="['inline-block px-2 py-0.5 rounded text-xs font-semibold', row.effLabel.cls]">
                      {{ row.l100 }} · {{ row.effLabel.text }}
                    </span>
                    <span v-else class="text-gray-500">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>
