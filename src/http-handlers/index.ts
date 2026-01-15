import { isBrowser, isNode } from 'browser-or-node'
import { OneBlinkNodeJsHandler } from './NodeJsHandler.js'
import { OneBlinkFetchHandler } from './FetchHandler.js'

export function getOneBlinkHttpHandler() {
  if (isBrowser) {
    return new OneBlinkFetchHandler()
  }
  if (isNode) {
    return new OneBlinkNodeJsHandler()
  }

  throw new Error('Could not find http handler matching current environment')
}
