import { setTmpAppName } from '../applications/app'

interface FakeWindow extends Window {
  count: number
  __WAYNE_MFE_NAME__: string
}

let activeProxySandboxCount = 0

function createFakeWindow(name: string) {
  const fakeWindow = {
    count: 1,
    __WAYNE_MFE_NAME__: name,
  } as FakeWindow

  return {
    fakeWindow,
  }
}

const naughtySafari = typeof document.all === 'function' && typeof document.all === 'undefined'
const callableFnCacheMap = new WeakMap<CallableFunction, boolean>()
export function isCallable(fn: any) {
  if (callableFnCacheMap.has(fn)) {
    return true
  }

  const callable = naughtySafari
    ? typeof fn === 'function' && typeof fn !== 'undefined'
    : typeof fn === 'function'
  if (callable) {
    callableFnCacheMap.set(fn, callable)
  }
  return callable
}

const boundedMap = new WeakMap<CallableFunction, boolean>()
export function isBoundedFunction(fn: CallableFunction) {
  if (boundedMap.has(fn)) {
    return boundedMap.get(fn)
  }
  /*
  indexOf is faster than startsWith
  see https://jsperf.com/string-startswith/72
   */
  const bounded = fn.name.indexOf('bound ') === 0 && !fn.hasOwnProperty('prototype')
  boundedMap.set(fn, bounded)
  return bounded
}

const fnRegexCheckCacheMap = new WeakMap<any | FunctionConstructor, boolean>()
export function isConstructable(fn: () => any | FunctionConstructor) {
  // prototype methods might be changed while code running, so we need check it every time
  const hasPrototypeMethods =
    fn.prototype &&
    fn.prototype.constructor === fn &&
    Object.getOwnPropertyNames(fn.prototype).length > 1

  if (hasPrototypeMethods) return true

  if (fnRegexCheckCacheMap.has(fn)) {
    return fnRegexCheckCacheMap.get(fn)
  }

  /*
    1. 有 prototype 并且 prototype 上有定义一系列非 constructor 属性
    2. 函数名大写开头
    3. class 函数
    满足其一则可认定为构造函数
   */
  let constructable = hasPrototypeMethods
  if (!constructable) {
    // fn.toString has a significant performance overhead, if hasPrototypeMethods check not passed, we will check the function string with regex
    const fnString = fn.toString()
    const constructableFunctionRegex = /^function\b\s[A-Z].*/
    const classRegex = /^class\b/
    constructable = constructableFunctionRegex.test(fnString) || classRegex.test(fnString)
  }

  fnRegexCheckCacheMap.set(fn, constructable)
  return constructable
}
const functionBoundedValueMap = new WeakMap<CallableFunction, CallableFunction>()

function getTargetValue(target: any, value: any): any {
  /*
    仅绑定 isCallable && !isBoundedFunction && !isConstructable 的函数对象，如 window.console、window.atob 这类，不然微应用中调用时会抛出 Illegal invocation 异常
    目前没有完美的检测方式，这里通过 prototype 中是否还有可枚举的拓展方法的方式来判断
    @warning 这里不要随意替换成别的判断方式，因为可能触发一些 edge case（比如在 lodash.isFunction 在 iframe 上下文中可能由于调用了 top window 对象触发的安全异常）
   */
  if (isCallable(value) && !isBoundedFunction(value) && !isConstructable(value)) {
    const cachedBoundFunction = functionBoundedValueMap.get(value)
    if (cachedBoundFunction) {
      return cachedBoundFunction
    }

    const boundValue = Function.prototype.bind.call(value, target)

    // some callable function has custom fields, we need to copy the enumerable props to boundValue. such as moment function.
    // use for..in rather than Object.keys.forEach for performance reason
    // eslint-disable-next-line guard-for-in,no-restricted-syntax
    for (const key in value) {
      boundValue[key] = value[key]
    }

    // copy prototype if bound function not have but target one have
    // as prototype is non-enumerable mostly, we need to copy it from target function manually
    if (value.hasOwnProperty('prototype') && !boundValue.hasOwnProperty('prototype')) {
      // we should not use assignment operator to set boundValue prototype like `boundValue.prototype = value.prototype`
      // as the assignment will also look up prototype chain while it hasn't own prototype property,
      // when the lookup succeed, the assignment will throw an TypeError like `Cannot assign to read only property 'prototype' of function` if its descriptor configured with writable false or just have a getter accessor
      // see https://github.com/umijs/qiankun/issues/1121
      Object.defineProperty(boundValue, 'prototype', {
        value: value.prototype,
        enumerable: false,
        writable: true,
      })
    }

    // Some util, like `function isNative() {  return typeof Ctor === 'function' && /native code/.test(Ctor.toString()) }` relies on the original `toString()` result
    // but bound functions will always return "function() {[native code]}" for `toString`, which is misleading
    if (typeof value.toString === 'function') {
      const valueHasInstanceToString =
        value.hasOwnProperty('toString') && !boundValue.hasOwnProperty('toString')
      const boundValueHasPrototypeToString = boundValue.toString === Function.prototype.toString

      if (valueHasInstanceToString || boundValueHasPrototypeToString) {
        const originToStringDescriptor = Object.getOwnPropertyDescriptor(
          valueHasInstanceToString ? value : Function.prototype,
          'toString',
        )

        Object.defineProperty(boundValue, 'toString', {
          ...originToStringDescriptor,
          ...(originToStringDescriptor?.get ? null : { value: () => value.toString() }),
        })
      }
    }

    functionBoundedValueMap.set(value, boundValue)
    return boundValue
  }

  return value
}

export type Sandbox = {
  name: string
  proxyWindow: FakeWindow
  getIsActive(): boolean
  active(): void
  inactive(): void
  execCode(code: any): unknown
}

export class ProxySandbox implements Sandbox {
  private isActive: boolean = false
  name: string
  proxyWindow: FakeWindow
  latestSetProp: PropertyKey | null = null

  constructor(name: string) {
    this.name = name
    const rawWindow = window
    const { fakeWindow } = createFakeWindow(name)

    const addedPropsMapInSandbox = new Map<PropertyKey, any>()
    const modifiedPropsOriginalValueMapInSandbox = new Map<PropertyKey, any>()
    const currentUpdatedPropsValueMap = new Map<PropertyKey, any>()

    const proxyWindow = new Proxy(fakeWindow, {
      set: (_: Window, p: PropertyKey, value: any): boolean => {
        if (this.isActive) {
          // 判断沙箱是否在启动
          if (!rawWindow.hasOwnProperty(p)) {
            // 当前 rawWindow 上没有该属性，在 addedPropsMapInSandbox 上记录添加的属性
            addedPropsMapInSandbox.set(p, value)
          } else if (!modifiedPropsOriginalValueMapInSandbox.has(p)) {
            // 如果当前 window 对象存在该属性，且 record map 中未记录过，则记录该属性初始值
            const originalValue = (rawWindow as any)[p]
            modifiedPropsOriginalValueMapInSandbox.set(p, originalValue)
          }
          // 记录新增和修改的属性
          currentUpdatedPropsValueMap.set(p, value)
          // 必须重新设置 window 对象保证下次 get 时能拿到已更新的数据
          ;(fakeWindow as any)[p] = value
          // 更新下最后设置的 props
          this.latestSetProp = p
          return true
        }
        // 在 strict-mode 下，Proxy 的 handler.set 返回 false 会抛出 TypeError，在沙箱卸载的情况下应该忽略错误
        return true
      },
      get(_: Window, p: PropertyKey): any {
        // setTmpAppName(fakeWindow.__WAYNE_MFE_NAME__)
        // 判断用 window.top, window.parent 等也返回代理对象，在 iframe 环境也会返回代理对象
        if (p === 'top' || p === 'parent' || p === 'window' || p === 'self') {
          return proxyWindow
        }
        if (fakeWindow.hasOwnProperty(p)) {
          return (fakeWindow as any)[p]
        }
        const value = (rawWindow as any)[p]

        return getTargetValue(rawWindow, value) // 返回当前值
      },
      /**
       * 用 in 操作判断属性是否存在的时候去 window 上判断,而不是在代理对象上判断
       */
      has(_: Window, p: string | number | symbol): boolean {
        setTmpAppName(fakeWindow.__WAYNE_MFE_NAME__)

        return p in rawWindow
      },
      /**
       * 获取对象属性描述的时候也是从 window 上去判断，代理对象上可能没有
       */
      getOwnPropertyDescriptor(_: Window, p: PropertyKey): PropertyDescriptor | undefined {
        const descriptor = Object.getOwnPropertyDescriptor(rawWindow, p)
        if (descriptor && !descriptor.configurable) {
          descriptor.configurable = true
        }
        return descriptor
      },
    }) as FakeWindow

    this.proxyWindow = proxyWindow

    activeProxySandboxCount++
  }

  getIsActive() {
    return this.isActive
  }
  active() {
    activeProxySandboxCount++
    this.isActive = true
  }
  inactive() {
    activeProxySandboxCount--
    this.isActive = false
  }

  execCode(code: any) {
    const proxyWindow = this.proxyWindow

    const fn = new Function(
      'proxyWindow',
      `
        (function(window, self, globalThis){
          with(window) {
            ${code}
          }
        })(
          proxyWindow,
          proxyWindow,
          proxyWindow,
        );
      `,
    )

    return fn(proxyWindow)
  }

  // execCode(code: any) {
  //   ;(window as any).__WAYNE_WINDOW_CONTEXT__ = this.proxyWindow
  //   // const proxy = this.proxyWindow
  //   const fn = new Function(
  //     `;(function(window, self, globalThis) {
  //       with(proxy){
  //         return code()
  //       }
  //     })(
  //       window.__WAYNE_WINDOW_CONTEXT__,
  //       window.__WAYNE_WINDOW_CONTEXT__,
  //       window.__WAYNE_WINDOW_CONTEXT__,
  //     )`,
  //   )

  //   return fn()
  // }
}
