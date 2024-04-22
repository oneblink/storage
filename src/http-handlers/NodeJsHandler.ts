import { NodeHttpHandler } from '@smithy/node-http-handler'
import { HttpRequest } from '@smithy/protocol-http'
import { HttpHandlerOptions } from '@smithy/types'
import { StorageConstructorOptions } from '../types'
import {
  RequestBodyHeader,
  IOneBlinkRequestHandler,
  OneBlinkResponse,
  FailResponse,
} from './types'
import { handleResponse, prepareRequest } from './handleRequest'

// Our own custom request handler to allow setting customer headers for
// authentication. Also allow the response header which includes dynamic
// data from the lambda at edge to be retrieved and held for later when
// the upload has completed.
export class OneBlinkNodeJsHandler<T>
  extends NodeHttpHandler
  implements IOneBlinkRequestHandler<T>
{
  constructor({
    getIdToken,
    requestBodyHeader,
  }: {
    getIdToken: StorageConstructorOptions['getIdToken']
    requestBodyHeader?: RequestBodyHeader
  }) {
    super()
    this.getIdToken = getIdToken
    this.requestBodyHeader = requestBodyHeader
  }

  getIdToken: StorageConstructorOptions['getIdToken']
  requestBodyHeader?: RequestBodyHeader
  oneblinkResponse?: OneBlinkResponse<T>
  failResponse?: FailResponse

  async handle(request: HttpRequest, options?: HttpHandlerOptions) {
    await prepareRequest(this, request)

    const result = await super.handle(request, options)

    await handleResponse(this, request, result.response)

    if (result.response.statusCode < 400) {
      return result
    }

    switch (result.response.headers['content-type']) {
      case 'application/json; charset=utf-8':
      case 'application/json': {
        const { Readable, consumers } = await import('stream')
        if (result.response.body instanceof Readable) {
          this.failResponse = {
            statusCode: result.response.statusCode,
            message: (
              (await consumers.json(result.response.body)) as FailResponse
            ).message,
          }
        }

        if (typeof result.response.body === 'string') {
          this.failResponse = {
            statusCode: result.response.statusCode,
            message: JSON.parse(result.response.body).message,
          }
        }
        break
      }
      case 'text/html': {
        const { Readable, consumers } = await import('stream')
        if (result.response.body instanceof Readable) {
          this.failResponse = {
            statusCode: result.response.statusCode,
            message: await consumers.text(result.response.body),
          }
        }

        if (typeof result.response.body === 'string') {
          console.log('response', result.response.body)
        }
        break
      }
    }

    return result
  }

  determineQueueSize() {
    return 10
  }
}
