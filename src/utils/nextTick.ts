export function nextTick(fn: () => void) {
  return Promise.resolve().then(fn)
}