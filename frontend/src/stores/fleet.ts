import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '../api/client'
import { subDays, format, startOfDay } from 'date-fns'

export interface Trip {
  Id: number
  StartTime: string
  FinishTime: string
  AverageSpeed: number
  MaxSpeed: number
  TripType: boolean
  StartPosition: { Latitude: string; Longitude: string }
  FinishPosition: { Latitude: string; Longitude: string }
  StartAddress: string
  FinishAddress: string
  TripLength: string
  TripWaitingTime: string
  TotalDistance: number
  DriverName: string
  IsFinished: boolean
  Odometer: number
  FuelConsumed: { Value: number; VolumeUnit: number }
  TripCost: { Value: number; Currency: number }
  vehicleCode?: string
  vehicleName?: string
}

export interface Vehicle {
  Code: string
  Name: string
  SPZ: string
  Speed: number
  LastPosition: { Latitude: string; Longitude: string }
  LastPositionTimestamp: string
  BranchName: string
  IsActive: boolean
  Odometer: number
  BatteryPercentage: number
}

export interface DriverStat {
  name: string
  trips: Trip[]
  totalDistance: number
  totalFuel: number
  totalCost: number
  avgEfficiency: number
  tripCount: number
}

export const useFleetStore = defineStore('fleet', () => {
  const vehicles = ref<Vehicle[]>([])
  const allTrips = ref<Trip[]>([])
  const loadingVehicles = ref(false)
  const loadingTrips = ref(false)
  const dateRange = ref(7)

  const dateFrom = computed(() => format(subDays(new Date(), dateRange.value), "yyyy-MM-dd'T'00:00"))
  const dateTo = computed(() => format(new Date(), "yyyy-MM-dd'T'23:59"))

  // Aggregated daily cost data for charts
  const dailyCostData = computed(() => {
    const days: Record<string, { date: string; cost: number; fuel: number; distance: number }> = {}

    for (let i = dateRange.value - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'MMM d')
      days[d] = { date: d, cost: 0, fuel: 0, distance: 0 }
    }

    allTrips.value.forEach(trip => {
      const d = format(new Date(trip.StartTime), 'MMM d')
      if (days[d]) {
        days[d].cost += Number(trip.TripCost?.Value) || 0
        days[d].fuel += Number(trip.FuelConsumed?.Value) || 0
        days[d].distance += Number(trip.TotalDistance) || 0
      }
    })

    return Object.values(days)
  })

  // Per-vehicle cost summary for bar chart
  const vehicleCostData = computed(() => {
    const vmap: Record<string, { name: string; cost: number; fuel: number; distance: number }> = {}

    allTrips.value.forEach(trip => {
      const key = trip.vehicleCode || 'Unknown'
      if (!vmap[key]) {
        vmap[key] = { name: trip.vehicleName || key, cost: 0, fuel: 0, distance: 0 }
      }
      vmap[key].cost += Number(trip.TripCost?.Value) || 0
      vmap[key].fuel += Number(trip.FuelConsumed?.Value) || 0
      vmap[key].distance += Number(trip.TotalDistance) || 0
    })

    return Object.values(vmap)
      .map(v => ({
        ...v,
        efficiency: v.distance > 0 ? (v.fuel / v.distance) * 100 : 0
      }))
      .sort((a, b) => b.cost - a.cost)
  })

  // Total fleet metrics
  const totalCost = computed(() => allTrips.value.reduce((s, t) => s + (Number(t.TripCost?.Value) || 0), 0))
  const totalFuel = computed(() => allTrips.value.reduce((s, t) => s + (Number(t.FuelConsumed?.Value) || 0), 0))
  const totalDistance = computed(() => allTrips.value.reduce((s, t) => s + (Number(t.TotalDistance) || 0), 0))
  const fleetEfficiency = computed(() =>
    totalDistance.value > 0 ? (totalFuel.value / totalDistance.value) * 100 : 0
  )

  // Per-driver stats
  const driverStats = computed((): DriverStat[] => {
    const dmap: Record<string, DriverStat> = {}

    allTrips.value.forEach(trip => {
      const name = trip.DriverName?.trim() || 'Unknown Driver'
      if (!dmap[name]) {
        dmap[name] = { name, trips: [], totalDistance: 0, totalFuel: 0, totalCost: 0, avgEfficiency: 0, tripCount: 0 }
      }
      dmap[name].trips.push(trip)
      dmap[name].totalDistance += Number(trip.TotalDistance) || 0
      dmap[name].totalFuel += Number(trip.FuelConsumed?.Value) || 0
      dmap[name].totalCost += Number(trip.TripCost?.Value) || 0
      dmap[name].tripCount++
    })

    return Object.values(dmap).map(d => ({
      ...d,
      avgEfficiency: d.totalDistance > 0 ? (d.totalFuel / d.totalDistance) * 100 : 0
    }))
  })

  const fetchVehicles = async () => {
    loadingVehicles.value = true
    try {
      vehicles.value = await apiClient.getVehicles()
    } finally {
      loadingVehicles.value = false
    }
  }

  const fetchAllTrips = async () => {
    if (vehicles.value.length === 0) await fetchVehicles()
    loadingTrips.value = true

    try {
      const results = await Promise.allSettled(
        vehicles.value.map(v =>
          apiClient.getTrips(v.Code, dateFrom.value, dateTo.value).then(trips =>
            trips.map((t: Trip) => ({ ...t, vehicleCode: v.Code, vehicleName: v.Name }))
          )
        )
      )

      allTrips.value = results
        .filter((r): r is PromiseFulfilledResult<Trip[]> => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime())
    } finally {
      loadingTrips.value = false
    }
  }

  const setDateRange = async (days: number) => {
    dateRange.value = days
    await fetchAllTrips()
  }

  return {
    vehicles, allTrips, loadingVehicles, loadingTrips, dateRange,
    dateFrom, dateTo, dailyCostData, vehicleCostData,
    totalCost, totalFuel, totalDistance, fleetEfficiency, driverStats,
    fetchVehicles, fetchAllTrips, setDateRange
  }
})
