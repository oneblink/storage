import { isBrowser, isNode } from 'browser-or-node'
import { OneBlinkNodeJsHandler } from './NodeJsHandler'
import { OneBlinkFetchHandler } from './FetchHandler'

export function getRequestHandler() {
  if (isBrowser) {
    return OneBlinkFetchHandler
  }
  if (isNode) {
    return OneBlinkNodeJsHandler
  }

  throw new Error('Could not find request handle matching current environment')
}
