<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Map, BarChart2, Users, Navigation } from 'lucide-vue-next'

const route = useRoute()

const navItems = [
  { name: 'Map', path: '/', icon: Map },
  { name: 'Cost', path: '/cost', icon: BarChart2 },
  { name: 'Drivers', path: '/drivers', icon: Users },
  { name: 'Trips', path: '/trips', icon: Navigation },
]
</script>

<template>
  <aside class="w-16 md:w-20 bg-dark-card flex flex-col items-center py-6 border-r border-gray-800 z-50">
    <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg mb-8 shadow-lg shadow-blue-500/20">
      FP
    </div>
    
    <nav class="flex flex-col gap-6 w-full">
      <router-link 
        v-for="item in navItems" 
        :key="item.name"
        :to="item.path"
        class="relative flex justify-center w-full py-2 group"
        :title="item.name"
      >
        <div v-if="route.path === item.path" class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-md"></div>
        <component 
          :is="item.icon" 
          :class="[
            'w-6 h-6 transition-colors duration-200', 
            route.path === item.path ? 'text-blue-500' : 'text-gray-500 group-hover:text-gray-300'
          ]" 
        />
      </router-link>
    </nav>
  </aside>
</template>
