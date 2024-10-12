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
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
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
      path: '/movecar',
      name: 'movecar',
      component: () => import('@/views/moveCar/MoveCar.vue')
    }
  ]
})

export default router
