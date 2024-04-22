import { FetchHttpHandler } from '@smithy/fetch-http-handler'
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
export class OneBlinkFetchHandler<T>
  extends FetchHttpHandler
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
        if (
          window.ReadableStream &&
          result.response.body instanceof window.ReadableStream
        ) {
          const fetchResponse = new Response(result.response.body)
          this.failResponse = {
            statusCode: result.response.statusCode,
            message: (await fetchResponse.json()).message,
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
        if (
          window.ReadableStream &&
          result.response.body instanceof window.ReadableStream
        ) {
          const fetchResponse = new Response(result.response.body)
          this.failResponse = {
            statusCode: result.response.statusCode,
            message: await fetchResponse.text(),
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
    const effectiveType =
      window.navigator &&
      'connection' in window.navigator &&
      !!window.navigator.connection &&
      typeof window.navigator.connection === 'object' &&
      'effectiveType' in window.navigator.connection
        ? window.navigator.connection.effectiveType
        : undefined
    switch (effectiveType) {
      case '4g':
        return 10
      case '3g':
        return 2
      case 'slow-2g':
      case '2g':
      default: {
        return 1
      }
    }
  }
}
