import { getCurrentAppName } from '../applications/app'

const rawCreateElement = document.createElement.bind(window.document)

export function injectCreateElement() {
  document.createElement = function (localName: string, opts: any) {
    const dom = rawCreateElement(localName, opts)
    const name = getCurrentAppName()
    name && dom.setAttribute('__micro_app_name__', name)

    switch (localName.toLocaleLowerCase()) {
      case 'style':
        ;(dom as HTMLStyleElement).disabled = true
        setTimeout(() => {
          replaceStyleSheet(dom as HTMLStyleElement)
          ;(dom as HTMLStyleElement).disabled = false
        })
        break
    }

    return dom
  }

  function replaceStyleSheet(styleSheetDom: HTMLStyleElement) {
    const rules: any[] = Array.prototype.map.call(
      (styleSheetDom.sheet?.rules || []) as CSSRuleList,
      (rule: CSSStyleRule): string => {
        // TODO: ignore media 之类的
        const selectorText = getNewSelector(rule)
        rule.selectorText = selectorText

        return rule.cssText.replace(rule.selectorText, selectorText)
      },
    )

    // styleSheetDom.textContent = rules.join(';')

    // rules.forEach((r: string, idx) => {
    //   styleSheetDom.sheet?.deleteRule(idx)
    //   styleSheetDom.sheet?.insertRule(r, idx)
    // })
    const content = rules.join('')

    styleSheetDom.replaceChildren(document.createTextNode(content))
  }

  function getNewSelector(rule: CSSStyleRule) {
    const name = getCurrentAppName()

    return rule.selectorText
      .split(',')
      .map((selector) => {
        return selector
          .split(' ')
          .map((s) => {
            return s.trim()?.length ? s + `[__micro_app_name__='${name}']` : ''
          })
          .join(' ')
      })
      .join(',')
  }
}
