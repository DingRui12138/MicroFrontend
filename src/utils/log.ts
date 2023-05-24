const PREFIX = '𒆙 [Wayne\'s MFE Demo] '

export function logMsg(msg: string) {
  console.log(`%c${PREFIX}%c${msg}`, 'color: blue', 'color: gray')
}
