<script setup lang="ts">
import { RouterView } from 'vue-router'
import SidebarMenu from './components/SidebarMenu.vue'
</script>

<template>
  <div class="flex h-screen w-full bg-dark-bg text-gray-100 overflow-hidden">
    <SidebarMenu />
    <main class="flex-1 relative h-full flex flex-col">
      <RouterView />
    </main>
  </div>
</template>

<style>
/* Leaflet map overrides to match dark theme nicely */
.leaflet-container {
  background-color: #0b0f1a !important;
}
.leaflet-popup-content-wrapper, .leaflet-popup-tip {
  background-color: #131825 !important;
  color: #f3f4f6 !important;
  border: 1px solid #1f2937;
}
</style>
