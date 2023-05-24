import { reroute } from './navigation/reroute'
import { logMsg } from './utils/log'

export let isStarted = false

export const start = () => {
  if (isStarted) {
    return
  }
  (window as any).__POWER_BY_WAYNE_MFE__ = true
  isStarted = true
  logMsg('start')

  reroute()
}
