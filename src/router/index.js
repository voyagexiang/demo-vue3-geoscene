import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },

    {
      path: '/mapPopup1',
      name: 'mapPopup1',
      component: () => import('@/views/mapPopup/one/index.vue')
    },
    {
      path: '/mapPopup2',
      name: 'mapPopup2',
      component: () => import('@/views/mapPopup/two/index.vue')
    },
    {
      path: '/mapmodel',
      name: 'mapmodel',
      component: () => import('@/views/gltfModelShow/index.vue')
    },
    {
      path: '/mapmodelmove',
      name: 'mapmodelmove',
      component: () => import('@/views/gltfModelMoveShow/index.vue')
    },
    {
      path: '/movecar',
      name: 'movecar',
      component: () => import('@/views/moveCar/index.vue')
    },
    {
      path: '/extrudeLayer',
      name: 'extrudeLayer',
      component: () => import('@/views/extrudeLayer/index.vue')
    },
    {
      path: '/bufferLine',
      name: 'bufferLine',
      component: () => import('@/views/bufferLine/index.vue')
    },
    {
      path: '/buildingEffect',
      name: 'buildingEffect',
      component: () => import('@/views/buildingEffect/index.vue')
    },
    {
      path: '/odline',
      name: 'odline',
      component: () => import('@/views/ODLine/index.vue')
    },
    {
      path: '/labelPoint',
      name: 'labelPoint',
      component: () => import('@/views/labelPoint/index.vue')
    },
    {
      path: '/cyclinderLayer',
      name: 'cyclinderLayer',
      component: () => import('@/views/cyclinderLayer/index.vue')
    }
  ]
})

export default router
