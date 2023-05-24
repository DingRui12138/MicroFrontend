import { logMsg } from '../utils/log'
import { apps, CustomProps, Registration } from './app'

export type ApplicationStatus =
  | typeof NOT_LOADED
  | typeof LOADING_SOURCE_CODE
  | typeof LOAD_ERROR
  | typeof NOT_BOOTSTRAPPED
  | typeof BOOTSTRAPPING
  | typeof NOT_MOUNTED
  | typeof MOUNTED
  | typeof UNMOUNTING
  | typeof UNLOADING
  | typeof UPDATING

export const NOT_LOADED = 'NOT_LOADED' // 未加载
export const LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE' // 加载中
export const LOAD_ERROR = 'LOAD_ERROR' // 加载失败
export const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED' // 未启动
export const BOOTSTRAPPING = 'BOOTSTRAPPING' // 启动中
export const NOT_MOUNTED = 'NOT_MOUNTED' // 未挂载
export const MOUNTED = 'MOUNTED' // 已挂载
export const UNMOUNTING = 'UNMOUNTING' // 卸载中 -> NOT_MOUNTED ｜ UNLOADING
export const UNLOADING = 'UNLOADING' //  完全卸载 -> NOT_LOADED
export const UPDATING = 'UPDATING' // 更新中

export function isActive<ExtraProps extends CustomProps>(app: Registration<ExtraProps>) {
  return app.status === MOUNTED
}

export function shouldBeActive<ExtraProps extends CustomProps>(app: Registration<ExtraProps>) {
  return app.activeWhen(window.location)
}

export function getAppChanges<ExtraProps extends CustomProps>() {
  const appsToLoad: Registration<ExtraProps>[] = []
  const appsToMount: Registration<ExtraProps>[] = []
  const appsToUnmount: Registration<ExtraProps>[] = []

  apps.forEach((app) => {
    const appShouldBeActive = shouldBeActive(app)

    switch (app.status) {
      case NOT_LOADED:
      case LOADING_SOURCE_CODE:
      case LOAD_ERROR:
      case UNLOADING:
        appShouldBeActive && appsToLoad.push(app)
        break

      case NOT_BOOTSTRAPPED:
      case BOOTSTRAPPING:
      case NOT_MOUNTED:
        appShouldBeActive && appsToMount.push(app)
        break

      case MOUNTED:
        !appShouldBeActive && appsToUnmount.push(app)
        break
    }
  })

  return {
    appsToLoad,
    appsToMount,
    appsToUnmount,
  }
}

export function triggerAppStatusHook<ExtraProps extends CustomProps>(
  app: Registration<ExtraProps>,
  status: ApplicationStatus,
): Registration<ExtraProps> {
  switch (status) {
    case LOAD_ERROR:
      // TODO: load count ++
      break

    case MOUNTED:
      app.sandbox.active()
      break

    case NOT_MOUNTED:
    case UNMOUNTING:
    case UNLOADING:
      app.sandbox.inactive()
      break
  }

  app.status = status
  logMsg(`${app.name} ${BOOTSTRAPPING}`)

  return app
}
