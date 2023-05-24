import { CustomProps, LifeCycleFn, Registration } from '../applications/app'
import {
  BOOTSTRAPPING,
  getAppChanges,
  LOADING_SOURCE_CODE,
  LOAD_ERROR,
  MOUNTED,
  NOT_BOOTSTRAPPED,
  NOT_LOADED,
  NOT_MOUNTED,
  shouldBeActive,
  triggerAppStatusHook,
  UNLOADING,
  UNMOUNTING,
} from '../applications/app.helpers'
import { isStarted } from '../start'
import { logMsg } from '../utils/log'
import { instantiateHook } from '../systemjs-hooks/instantiate'
import './navigation-events'

export const reroute = () => {
  const { appsToLoad, appsToMount, appsToUnmount } = getAppChanges()

  if (isStarted) {
    return performAppChanges()
  }

  return loadApps()

  // 挂载需要的（可能没加载过），卸载不需要的
  function performAppChanges() {
    // 运行 app (bootstrap mount unmount)
    const unmountPromises = Promise.all(appsToUnmount.map(toUnmountPromise))

    // 加载
    appsToLoad.map(
      (app) => toLoadPromise(app).then((app) => tryBootstrapAndMount(app, unmountPromises)),
      // .then(() => {
      //   console.log(`${app.name} loaded -> bootstrapped -> mounted`)
      // }),
    )

    // 挂载
    appsToMount.map(
      (app) => tryBootstrapAndMount(app, unmountPromises),
      // .then(() => {
      //   console.log(`${app.name} bootstrapped -> mounted`)
      // }),
    )
  }

  function loadApps() {
    const loadPromises = appsToLoad.map(toLoadPromise)

    return Promise.all(loadPromises).then(performAppChanges)
  }
}

const toLoadPromise = <ExtraProps extends CustomProps>(
  app: Registration<ExtraProps>,
): Promise<any> => {
  // 获取应用的接入协议 bootstrap mount unmount
  return Promise.resolve().then(() => {
    // 未加载 or 已完全卸载 才需要加载
    if ([NOT_LOADED, UNLOADING].includes(app.status)) {
      // app.status = LOADING_SOURCE_CODE
      // logMsg(`${app.name} ${LOADING_SOURCE_CODE}`)
      triggerAppStatusHook(app, LOADING_SOURCE_CODE)

      // does not work
      // const loadFn = new Function('proxyWindow', 'app', `
      //   return (function(window, self, globalThis) {
      //     with (window) {
      //       console.log("🚀 ~ file: reroute.ts:69 ~ with ~ window:", window)
      //       // 这边的 window 是 fakeWindow
      //       return app.loadApp.bind(window)()
      //     }
      //   })(proxyWindow, proxyWindow, proxyWindow)
      // `)

      // return loadFn(app.sandbox.proxyWindow, app).then((protocol: any) => {
      //   const { bootstrap, mount, unmount } = protocol

      //   app.status = NOT_BOOTSTRAPPED
      //   logMsg(`${app.name} ${NOT_BOOTSTRAPPED}`)

      //   app.protocol = {
      //     bootstrap: flattenFnArray<ExtraProps>(bootstrap) as LifeCycleFn<ExtraProps>,
      //     mount: flattenFnArray<ExtraProps>(mount) as LifeCycleFn<ExtraProps>,
      //     unmount: flattenFnArray<ExtraProps>(unmount) as LifeCycleFn<ExtraProps>,
      //   }

      //   return app
      // })

      instantiateHook(app.name, app.sandbox)

      return app.loadApp().then((protocol) => {
        const { bootstrap, mount, unmount } = protocol

        // app.status = NOT_BOOTSTRAPPED
        // logMsg(`${app.name} ${NOT_BOOTSTRAPPED}`)
        triggerAppStatusHook(app, NOT_BOOTSTRAPPED)

        app.protocol = {
          bootstrap: flattenFnArray<ExtraProps>(bootstrap) as LifeCycleFn<ExtraProps>,
          mount: flattenFnArray<ExtraProps>(mount) as LifeCycleFn<ExtraProps>,
          unmount: flattenFnArray<ExtraProps>(unmount) as LifeCycleFn<ExtraProps>,
        }

        return app
      }).catch((e: Error) => {
        // TODO: retry
        triggerAppStatusHook(app, LOAD_ERROR)
      })
    } else {
      return app
    }
  })
}

/**
 * promise 链式处理
 * @param fns
 * @returns
 */
function flattenFnArray<ExtraProps extends CustomProps>(
  fns: LifeCycleFn<ExtraProps> | LifeCycleFn<ExtraProps>[],
) {
  // fixme: fns type
  // fns = (Array.isArray(fns) ? fns : [fns]) as LifeCycleFn<ExtraProps>[]
  const tmpFns = Array.isArray(fns) ? fns : [fns]

  return (customProps: ExtraProps) => {
    return tmpFns.reduce((rsPromise: Promise<any>, fn) => {
      return rsPromise.then(() => fn(customProps))
    }, Promise.resolve())
  }
}
/**
 * 尝试挂载
 * @param app
 * @param unmountPromise
 * @returns
 */
function tryBootstrapAndMount<ExtraProps extends CustomProps>(
  app: Registration<ExtraProps>,
  unmountPromise: Promise<unknown>,
) {
  return Promise.resolve().then(() => {
    return toBootstrapPromise(app).then((app) => {
      // 全部卸载完成再挂载新 app
      unmountPromise.then(() => {
        if (shouldBeActive(app)) {
          toMountPromise(app)
        }
      })
    })
  })
}

/**
 * 处理 mount
 * @param app
 * @returns
 */
function toMountPromise<ExtraProps extends CustomProps>(app: Registration<ExtraProps>) {
  return Promise.resolve().then(() => {
    // 只处理处于待挂载的
    if (app.status !== NOT_MOUNTED) {
      return app
    }

    // it does not work
    // const mountFn = new Function('app', `
    //   return (function(window) {
    //     with (window) {
    //       return app.protocol?.mount(app.customProps)
    //     }
    //   })(app.sandbox.proxyWindow)
    // `)

    // return mountFn(app).then(() => {
    //   app.status = MOUNTED
    //   logMsg(`${app.name} ${MOUNTED}`)

    //   return app
    // })

    return app.protocol?.mount(app.customProps).then(() => {
      // app.status = MOUNTED
      // logMsg(`${app.name} ${MOUNTED}`)

      // return app

      return triggerAppStatusHook(app, MOUNTED)
    })
  })
}

/**
 * 启动 promise
 * @param app
 * @returns
 */
function toBootstrapPromise<ExtraProps extends CustomProps>(app: Registration<ExtraProps>) {
  return Promise.resolve().then(() => {
    // 只处理未启动的
    if (app.status !== NOT_BOOTSTRAPPED) {
      return app
    }

    triggerAppStatusHook(app, BOOTSTRAPPING)
    // app.status = BOOTSTRAPPING
    // logMsg(`${app.name} ${BOOTSTRAPPING}`)

    return app.protocol!.bootstrap(app.customProps).then(() => {
      triggerAppStatusHook(app, NOT_MOUNTED)
      // app.status = NOT_MOUNTED
      // logMsg(`${app.name} ${NOT_MOUNTED}`)

      return app
    })
  })
}

/**
 * 卸载 promise
 * @param app
 * @returns
 */
function toUnmountPromise<ExtraProps extends CustomProps>(app: Registration<ExtraProps>) {
  return Promise.resolve().then(() => {
    if (app.status !== MOUNTED) {
      return app
    }

    triggerAppStatusHook(app, UNMOUNTING)
    // app.status = UNMOUNTING
    // logMsg(`${app.name} ${UNMOUNTING}`)

    return app.protocol?.unmount(app.customProps).then(() => {
      // app.status = NOT_MOUNTED
      // logMsg(`${app.name} ${NOT_MOUNTED}`)

      // return app

      return triggerAppStatusHook(app, NOT_MOUNTED)
    })
  })
}

