import React from 'react'
import ReactDOM from 'react-dom'
import singleSpaReact from 'single-spa-react'
import Root from './root.component'

const lifeCycles = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: Root,
  domElementGetter: () => document.getElementById('react-app-root'),
  errorBoundary(err, info, props) {
    console.log('🚀 ~ file: wayne-react-app.tsx:12 ~ errorBoundary ~ err:', err)
    // Customize the root error boundary for your microfrontend here.
    return null
  },
})

// export const { bootstrap, mount, unmount } = lifeCycles;

const { bootstrap, mount: mountFn, unmount } = lifeCycles
const mount = function (config) {
  console.log('react-app mounted', config, window)
  ;(window as any).count += 1
  return mountFn(config)
}

export { bootstrap, unmount, mount }
