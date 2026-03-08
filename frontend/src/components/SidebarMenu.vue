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
  <!--
    Desktop (md+): vertical left sidebar, icons only.
    Mobile (<md): fixed bottom tab bar with icon + label.
    The main content area adds pb-16 on mobile via a companion class in App.vue
    to avoid content hiding behind the bottom bar.
  -->

  <!-- Desktop sidebar -->
  <aside class="hidden md:flex w-16 lg:w-20 bg-dark-card flex-col items-center py-6 border-r border-gray-800 flex-shrink-0 z-50">
    <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-base mb-8 shadow-lg shadow-blue-500/20 select-none">
      FP
    </div>
    <nav class="flex flex-col gap-5 w-full">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        class="relative flex justify-center w-full py-2.5 group"
        :title="item.name"
      >
        <div v-if="route.path === item.path" class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-md"></div>
        <component
          :is="item.icon"
          :class="[
            'w-5 h-5 transition-colors duration-150',
            route.path === item.path ? 'text-blue-500' : 'text-gray-500 group-hover:text-gray-300'
          ]"
        />
      </router-link>
    </nav>
  </aside>

  <!-- Mobile bottom tab bar -->
  <nav
    class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-card border-t border-gray-800 flex items-stretch safe-bottom"
    style="padding-bottom: env(safe-area-inset-bottom, 0px)"
  >
    <router-link
      v-for="item in navItems"
      :key="item.name"
      :to="item.path"
      class="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium tracking-wide transition-colors"
      :class="route.path === item.path ? 'text-blue-500' : 'text-gray-500'"
    >
      <component :is="item.icon" class="w-5 h-5" />
      {{ item.name }}
    </router-link>
  </nav>
</template>
