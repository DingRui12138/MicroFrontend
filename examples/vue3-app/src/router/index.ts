import { createRouter, createWebHistory, RouteRecordRaw, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/vue-app',
    // redirect: '/home',
    children: [
      {
        path: '',
        name: 'home',
        component: HomeView,
      },
      {
        path: 'about',
        name: 'about',
        // TODO: lazyload error 'Loading chunk about failed'
        // which is lazy-loaded when the route is visited.
        // component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue'),
        component: AboutView,
      },
    ],
  },
]

console.log('🚀 ~ file: index.ts:24 ~ process.env:', process.env)

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  // history: createWebHashHistory('/vue-app#'),
  routes,
})

export default router
