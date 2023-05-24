import { h, createApp } from 'vue'
import singleSpaVue from 'single-spa-vue'

import App from './App.vue'
import router from './router'

const vueLifeCycles = singleSpaVue({
  createApp,
  appOptions: {
    el: '#vue-app-root',
    render(props: Record<PropertyKey, any> = {}) {
      return h(App, {
        ...props,
        // single-spa props are available on the "this" object. Forward them to your component as needed.
        // https://single-spa.js.org/docs/building-applications#lifecycle-props
        // if you uncomment these, remember to add matching prop definitions for them in your App.vue file.
        /*
        name: this.name,
        mountParcel: this.mountParcel,
        singleSpa: this.singleSpa,
        */
      })
    },
  },
  handleInstance(app) {
    app.use(router)
  },
})

export const bootstrap = vueLifeCycles.bootstrap
export const mount = vueLifeCycles.mount
export const unmount = vueLifeCycles.unmount
