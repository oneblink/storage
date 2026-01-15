import { HttpRequest, HttpResponse } from '@smithy/protocol-http'
import { HttpHandlerOptions } from '@smithy/types'
import { IOneBlinkHttpHandler, FailResponse } from './types.js'
import { GetObjectCommandOutput } from '@aws-sdk/client-s3'

export class OneBlinkNodeJsHandler implements IOneBlinkHttpHandler {
  async handleRequest(
    request: HttpRequest,
    options?: HttpHandlerOptions | undefined,
  ) {
    const { NodeHttpHandler } = await import('@smithy/node-http-handler')
    const nodeHttpHandler = new NodeHttpHandler()
    const { response } = await nodeHttpHandler.handle(request, options)
    return response
  }

  async handleFailResponse(response: HttpResponse) {
    switch (response.headers['content-type']) {
      case 'application/json; charset=utf-8':
      case 'application/json': {
        const { Readable } = await import('stream')
        if (response.body instanceof Readable) {
          const consumers = await import('stream/consumers')
          return {
            statusCode: response.statusCode,
            message: ((await consumers.json(response.body)) as FailResponse)
              .message,
          }
        }

        if (typeof response.body === 'string') {
          return {
            statusCode: response.statusCode,
            message: JSON.parse(response.body).message,
          }
        }
        break
      }
      default: {
        const { Readable } = await import('stream')
        if (response.body instanceof Readable) {
          const consumers = await import('stream/consumers')
          return {
            statusCode: response.statusCode,
            message: await consumers.text(response.body),
          }
        }

        if (typeof response.body === 'string') {
          return {
            statusCode: response.statusCode,
            message: response.body,
          }
        }
        break
      }
    }
  }

  async parseGetObjectCommandOutputAsJson<T>(
    getObjectCommandOutput: GetObjectCommandOutput,
  ): Promise<T | undefined> {
    const { Readable } = await import('stream')
    if (getObjectCommandOutput.Body instanceof Readable) {
      const consumers = await import('stream/consumers')
      return (await consumers.json(getObjectCommandOutput.Body)) as T
    }
  }

  determineUploadQueueSize() {
    return 10
  }
}
