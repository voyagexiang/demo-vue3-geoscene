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
    },
    {
      path: '/3dtiles',
      name: '3dtiles',
      component: () => import('@/views/3dtiles/index.vue')
    },
    {
      path: '/scanningLight',
      name: 'scanningLight',
      component: () => import('@/views/scanningLight/index.vue')
    },
    {
      path: '/dynamicCircle',
      name: 'dynamicCircle',
      component: () => import('@/views/dynamicCircle/index.vue')
    },
    {
      path: '/flyline',
      name: 'flyline',
      component: () => import('@/views/flyline/index.vue')
    },
    {
      path: '/flashWall',
      name: 'flashWall',
      component: () => import('@/views/flashWall/index.vue')
    },
    {
      path: '/flashLine',
      name: 'flashLine',
      component: () => import('@/views/flashLine/index.vue')
    },
    {
      path: '/video',
      name: 'video',
      component: () => import('@/views/video/index.vue')
    },
    {
      path: '/visualTracking',
      name: 'visualTracking',
      component: () => import('@/views/visualTracking/index.vue')
    }
  ]
})

export default router
