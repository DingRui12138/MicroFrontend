import { Sandbox } from '../sandboxes/proxy-sandbox'

export function instantiateHook(name: string, sandbox: Sandbox) {
  const systemJSPrototype = (window as any).System.constructor.prototype
  const instantiate = systemJSPrototype.instantiate as Function

  systemJSPrototype.instantiate = function(url: string, firstParentUrl: string) {
    // TODO: impl real isMicroAppEntryJs
    const isMicroAppEntryJs = !firstParentUrl

    if (isMicroAppEntryJs) {
      return new Promise((resolve, reject) => {
        return window
          .fetch(url)
          .then((res: Response) => {
            res.text().then(code => {
              // TODO: try to return code text, not exec code with sandbox here
              sandbox.execCode(code)
              resolve((window as any).System.getRegister())
            })
          })
          .catch((err: Error) => {
            reject(
              Error('Error loading ' + url + (firstParentUrl ? ' from ' + firstParentUrl : '')),
            )
          })
      })
    }

    return instantiate.call((window as any).System, ...arguments)
  }
}