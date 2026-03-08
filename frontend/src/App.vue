<script setup lang="ts">
import { RouterView } from 'vue-router'
import SidebarMenu from './components/SidebarMenu.vue'
</script>

<template>
  <!--
    Use h-dvh for the real visible viewport on iOS Safari.
    The #app element in main.css also sets height: 100dvh so this
    is belt-and-suspenders — one of them will work on every browser.
  -->
  <div class="flex w-full bg-dark-bg text-gray-100 overflow-hidden" style="height: 100dvh">
    <!-- Left sidebar: desktop only -->
    <SidebarMenu />

    <!-- Main content: shrinks to fill remaining width, uses min-h-0 to
         allow flex children to scroll correctly on Safari -->
    <main class="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
      <RouterView />
    </main>
  </div>
</template>

<style>
/* Leaflet dark theme overrides */
.leaflet-container {
  background-color: #0b0f1a !important;
}
.leaflet-popup-content-wrapper,
.leaflet-popup-tip {
  background-color: #131825 !important;
  color: #f3f4f6 !important;
  border: 1px solid #1f2937;
}
/* Prevent Leaflet controls from overlapping mobile bottom nav */
.leaflet-bottom {
  bottom: 0;
}
</style>
