import { isBrowser, isNode } from 'browser-or-node'
import { OneBlinkNodeJsHandler } from './NodeJsHandler.js'
import { OneBlinkFetchHandler } from './FetchHandler.js'

export function getOneBlinkHttpHandler({
  disableCache,
}: {
  /** Set to `true` to prevent the browser caching the response */
  disableCache?: boolean
} = {}) {
  if (isBrowser) {
    return new OneBlinkFetchHandler({ disableCache })
  }
  if (isNode) {
    return new OneBlinkNodeJsHandler()
  }

  throw new Error('Could not find http handler matching current environment')
}
