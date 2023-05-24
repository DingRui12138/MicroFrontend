// import './systemjs-hooks/instantiate'
import { injectCreateElement } from './injects/dom'

injectCreateElement()

export { registerApplication } from './applications/app'
export { start } from './start'

