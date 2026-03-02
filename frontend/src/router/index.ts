import { createRouter, createWebHistory } from 'vue-router'
import MapView from '../views/MapView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'map',
      component: MapView
    },
    {
      path: '/cost',
      name: 'cost',
      component: () => import('../views/CostView.vue')
    },
    {
      path: '/drivers',
      name: 'drivers',
      component: () => import('../views/DriversView.vue')
    },
    {
      path: '/trips',
      name: 'trips',
      component: () => import('../views/TripsView.vue')
    }
  ]
})

export default router
