import { App, createApp, h } from 'vue'
import singleSpaVue from 'single-spa-vue'
import AppComp from './App.vue'
import router from './router'
import store from './store'

const vueLifeCycles = singleSpaVue({
  createApp,
  appOptions: {
    el: '#vue-app-root',
    render() {
      return h(AppComp, {})
    },
  },
  handleInstance(app) {
    app.use(router).use(store)
  },
})

export const bootstrap = vueLifeCycles.bootstrap
export const mount = vueLifeCycles.mount
export const unmount = vueLifeCycles.unmount

// let instance: App<Element> | null

// if (!(window as any).__POWER_BY_WAYNE_MFE__) {
//   mount()
// }

// export async function bootstrap(props: Record<string | number, unknown> = {}) {
//   console.log("🚀 ~ file: main.ts:9 ~ bootstrap ~ props:", props)
// }

// export async function mount(props: Record<string | number, unknown> = {}) {
//   console.log("🚀 ~ file: main.ts:13 ~ mount ~ props:", props)
//   instance = createApp(AppComp, props).use(store).use(router)
//   instance.mount((window as any).__POWER_BY_WAYNE_MFE__ ? '#vue-app-root' : '#app')
// }

// export async function unmount(props: Record<string | number, unknown> = {}) {
//   instance?.unmount()
//   instance = null
// }
