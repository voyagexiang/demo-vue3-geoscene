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
      component: () => import('@/views/mapPopup/one/MapView.vue')
    },
    {
      path: '/mapPopup2',
      name: 'mapPopup2',
      component: () => import('@/views/mapPopup/two/MapView.vue')
    },
    {
      path: '/mapmodel',
      name: 'mapmodel',
      component: () => import('@/views/gltfModelShow/MapModelView.vue')
    },
    {
      path: '/mapmodelmove',
      name: 'mapmodelmove',
      component: () => import('@/views/gltfModelMoveShow/MapModelMoveView.vue')
    },
    {
      path: '/movecar',
      name: 'movecar',
      component: () => import('@/views/moveCar/MoveCar.vue')
    }
  ]
})

export default router
