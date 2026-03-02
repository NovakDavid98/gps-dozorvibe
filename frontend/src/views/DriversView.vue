<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(true)

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 400)
})
</script>

<template>
  <div class="p-8 h-full overflow-y-auto bg-dark-bg">
    <div class="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 class="text-2xl font-bold text-white tracking-tight">Driver Leaderboard</h1>
        <p class="text-gray-400 text-sm mt-1">Rank drivers by fuel efficiency and distance covered.</p>
      </header>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>

      <div v-else class="flex gap-8">
        <!-- Driver List -->
        <div class="w-full lg:w-1/2 space-y-4">
          <div class="flex gap-2 mb-6">
            <button class="px-4 py-1.5 rounded-full text-sm font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30">Fuel Efficiency</button>
            <button class="px-4 py-1.5 rounded-full text-sm font-medium bg-dark-card text-gray-400 hover:text-gray-200 border border-transparent">Distance</button>
          </div>

          <div v-for="i in 5" :key="i" class="bg-dark-card border border-gray-800 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-gray-700 transition-colors">
            <div class="w-8 text-center text-gray-500 font-bold">#{{ i }}</div>
            <div class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-sm text-gray-300">
              D{{ i }}
            </div>
            <div class="flex-1">
              <div class="font-semibold text-gray-200">Driver {{ i }}</div>
              <div class="text-xs text-gray-500">1,24{{ i }} km · {{ 70 + i * 5 }} L</div>
            </div>
            <div class="text-right">
              <div :class="['font-bold', i < 3 ? 'text-status-green' : 'text-status-yellow']">
                {{ (6.1 + i * 0.5).toFixed(1) }}
              </div>
              <div class="text-[10px] text-gray-500 uppercase tracking-wide">L/100km</div>
            </div>
          </div>
        </div>

        <!-- Driver Detail Placeholder -->
        <div class="hidden lg:block lg:w-1/2">
          <div class="sticky top-8 bg-dark-card border border-gray-800 rounded-xl p-6 h-[500px] flex items-center justify-center">
             <p class="text-gray-500 text-sm">Select a driver to view detailed statistics and typical coverage area.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
