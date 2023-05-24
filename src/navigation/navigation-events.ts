import { reroute } from "./reroute"

const originalAddEventListener = window.addEventListener
const originalRemoveEventListener = window.removeEventListener
const routerEventNames: string[] = ['hashchange', 'popstate']
const capturedEventListener = routerEventNames.reduce((rs, eventName) => {
  return {
    ...rs,
    [eventName]: [],
  }
}, {}) as Record<
  typeof routerEventNames[number],
  {
    listener: typeof localAddEventListener
    opts: boolean | AddEventListenerOptions | undefined
  }[]
>

function localAddEventListener<K extends keyof WindowEventMap>(
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions,
): void
function localAddEventListener(
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): void
function localAddEventListener<T extends keyof WindowEventMap>(
  type: T,
  listener: any,
  options?: any,
) {
  if (routerEventNames.includes(type)) {
    return capturedEventListener[type].push({
      listener,
      opts: options,
    })
  } else {
    originalAddEventListener.apply(window, [type, listener, options])
  }
}

function localRemoveEventListener<K extends keyof WindowEventMap>(
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | EventListenerOptions,
): void
function localRemoveEventListener(
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions,
): void
function localRemoveEventListener(type: any, listener: any, options?: any) {
  if (routerEventNames.includes(type)) {
    return (capturedEventListener[type] = capturedEventListener[type].filter(
      (i) => i.listener !== listener,
    ))
  } else {
    return originalRemoveEventListener.apply(window, [type, listener, options])
  }
}

window.addEventListener('hashchange', () => {
  reroute()
})

window.addEventListener = localAddEventListener
window.removeEventListener = localRemoveEventListener
