import { reroute } from '../navigation/reroute'
import { ProxySandbox, type Sandbox } from '../sandboxes/proxy-sandbox'
import { logMsg } from '../utils/log'
import { ApplicationStatus, NOT_LOADED } from './app.helpers'

export type CustomProps = {
  [str: string]: any
  [num: number]: any
}
export type LifeCycleFn<T extends CustomProps = CustomProps> = (customProps?: T) => Promise<any>
type LifeCycles<T extends CustomProps> = {
  bootstrap: LifeCycleFn<T> | LifeCycleFn<T>[]
  mount: LifeCycleFn<T> | LifeCycleFn<T>[]
  unmount: LifeCycleFn<T> | LifeCycleFn<T>[]
}
type RegisterOpts<T extends CustomProps> = {
  name: string
  loadApp: () => Promise<LifeCycles<T>>
  activeWhen: (location: Window['location']) => boolean
  customProps?: T
}

export type Registration<T extends CustomProps> = RegisterOpts<T> & {
  status: ApplicationStatus
  sandbox: Sandbox
  protocol?: {
    bootstrap: LifeCycleFn<T>
    mount: LifeCycleFn<T>
    unmount: LifeCycleFn<T>
  }
}
// FIXME: remove "| any". should be like ExtraProps extends CustomProps
export const apps: Registration<CustomProps | any>[] = []

export function registerApplication<T extends CustomProps = {}>(
  name: RegisterOpts<T>['name'],
  loadApp: RegisterOpts<T>['loadApp'],
  activeWhen: RegisterOpts<T>['activeWhen'],
  customProps?: RegisterOpts<T>['customProps'],
): void

export function registerApplication<T extends CustomProps>(opts: RegisterOpts<T>): void

export function registerApplication<T extends CustomProps>(
  name: any,
  loadApp?: any,
  activeWhen?: any,
  customProps?: any,
): void {
  const registration: Registration<T> =
    typeof name === 'object'
      ? {
          ...name,
          status: NOT_LOADED,
          sandbox: new ProxySandbox(name?.name),
        }
      : {
          name,
          loadApp,
          activeWhen,
          customProps,
          status: NOT_LOADED,
          sandbox: new ProxySandbox(name),
        }

  apps.push(registration) // 注册到数组中后续可筛选
  logMsg(`${registration.name} registered`)

  // 预加载
  reroute()
}

let tmpAppName: string | null
let clearTimeoutId: number | null
export function setTmpAppName(name: string) {
  clearTimeoutId && clearTimeout(clearTimeoutId)
  tmpAppName = name
  clearTimeoutId = window.setTimeout(() => {
    tmpAppName = null
  }, 0)
}
export function getCurrentAppName() {
  return tmpAppName
  // return Promise.resolve().then(() => v)
}
export function getCurrentApp() {
  if (tmpAppName) {
    return apps.find((app) => app.name === tmpAppName)
  } else {
    return undefined
  }
}

// type Obj = {
//   key: string
// }
// type GetFn<T> = (props?: T) => Promise<any>
// type Item<T extends Obj = Obj> = {
//   getValue: GetFn<T>
// }

// const list = (<T extends Obj>() => {
//   const list: Item<T>[] = [] as Item<T>[]
//   return list
// })()

// function pushItem<T extends Obj>(getFn: GetFn<T>) {
//   const item: Item<T> = {
//     getValue: getFn,
//   }

//   list.push(item)
// }

// type fn<T extends string> = (arg: T) => void

// let tmp: fn<string>

// function set<T extends string>(arg: T) {
//   tmp = arg
// }

// type Base = {
//   key: string
//   getValue: () => Promise<number>
// }
// type Arg<T extends Base> = T

// function calcValue<T extends Base>(arg: T) {

// }

// calcValue({})
