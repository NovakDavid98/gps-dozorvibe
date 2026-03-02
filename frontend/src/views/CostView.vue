<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(true)

onMounted(() => {
  // In a real implementation, we would fetch trip data here to calculate costs
  setTimeout(() => {
    loading.value = false
  }, 500)
})
</script>

<template>
  <div class="p-8 h-full overflow-y-auto bg-dark-bg">
    <div class="max-w-6xl mx-auto space-y-8">
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Cost & Efficiency</h1>
          <p class="text-gray-400 text-sm mt-1">Analyze fleet expenditure and fuel consumption.</p>
        </div>
        
        <div class="flex gap-4">
          <select class="bg-dark-card border border-gray-800 text-sm rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-blue-500">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Month</option>
          </select>
        </div>
      </header>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Mock Data Cards -->
        <div class="bg-dark-card border border-gray-800 rounded-xl p-6">
          <div class="text-sm font-medium text-gray-400 mb-2">Total Cost</div>
          <div class="text-3xl font-bold text-white">42,850 <span class="text-lg text-gray-500 font-normal">CZK</span></div>
        </div>
        
        <div class="bg-dark-card border border-gray-800 rounded-xl p-6">
          <div class="text-sm font-medium text-gray-400 mb-2">Total Fuel Consumed</div>
          <div class="text-3xl font-bold text-white">1,240 <span class="text-lg text-gray-500 font-normal">L</span></div>
        </div>
        
        <div class="bg-dark-card border border-gray-800 rounded-xl p-6">
          <div class="text-sm font-medium text-gray-400 mb-2">Fleet Average Efficiency</div>
          <div class="text-3xl font-bold text-status-yellow">8.4 <span class="text-lg text-gray-500 font-normal">L/100km</span></div>
        </div>

        <div class="lg:col-span-3 bg-dark-card border border-gray-800 rounded-xl p-6 min-h-[300px] flex items-center justify-center">
          <p class="text-gray-500 text-sm">Chart visualization goes here (Requires chart.js setup with actual trip data)</p>
        </div>
      </div>
    </div>
  </div>
</template>
