import { HttpRequest, HttpResponse } from '@smithy/protocol-http'
import { HttpHandlerOptions } from '@smithy/types'
import { IOneBlinkHttpHandler } from './types'
import { GetObjectCommandOutput } from '@aws-sdk/client-s3'

export class OneBlinkFetchHandler implements IOneBlinkHttpHandler {
  async handleRequest(request: HttpRequest, options?: HttpHandlerOptions) {
    const { FetchHttpHandler } = await import('@smithy/fetch-http-handler')
    const fetchHttpHandler = new FetchHttpHandler()
    const { response } = await fetchHttpHandler.handle(request, options)
    return response
  }

  async handleFailResponse(response: HttpResponse) {
    const fetchResponse = new Response(response.body)

    switch (response.headers['content-type']) {
      case 'application/json; charset=utf-8':
      case 'application/json': {
        return {
          statusCode: response.statusCode,
          message: (await fetchResponse.json()).message,
        }
      }
      default: {
        return {
          statusCode: response.statusCode,
          message: await fetchResponse.text(),
        }
      }
    }
  }

  async parseGetObjectCommandOutputAsJson<T>(
    getObjectCommandOutput: GetObjectCommandOutput,
  ): Promise<T | undefined> {
    if (
      getObjectCommandOutput.Body instanceof Blob ||
      (window.ReadableStream &&
        getObjectCommandOutput.Body instanceof window.ReadableStream)
    ) {
      return (await new Response(getObjectCommandOutput.Body).json()) as T
    }
  }

  determineUploadQueueSize() {
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
