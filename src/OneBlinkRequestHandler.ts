import { HttpRequest, HttpResponse } from '@smithy/protocol-http'
import { RequestHandler } from '@smithy/types'
import {
  RequestBodyHeader,
  IOneBlinkHttpHandler,
  OneBlinkResponse,
  FailResponse,
} from './http-handlers/types'
import OneBlinkStorageError from './OneBlinkStorageError'

/**
 * Our own custom request handler to allow the response header which includes
 * dynamic data from the lambda at edge to be retrieved and held for later when
 * the upload has completed.
 */
export class OneBlinkRequestHandler<T>
  implements RequestHandler<HttpRequest, HttpResponse>
{
  requestBodyHeader?: RequestBodyHeader
  oneBlinkHttpHandler: IOneBlinkHttpHandler
  oneblinkResponse?: OneBlinkResponse<T>
  failResponse?: FailResponse

  constructor(
    oneBlinkHttpHandler: IOneBlinkHttpHandler,
    requestBodyHeader?: RequestBodyHeader,
  ) {
    this.oneBlinkHttpHandler = oneBlinkHttpHandler
    this.requestBodyHeader = requestBodyHeader
  }

  async handle(request: HttpRequest) {
    if (this.requestBodyHeader) {
      request.headers['x-oneblink-request-body'] = JSON.stringify(
        this.requestBodyHeader,
      )
    }

    if (this.oneblinkResponse) {
      request.query['key'] = this.oneblinkResponse.s3.key
    }

    const requestUrl = `${request.method} ${request.protocol}//${request.hostname}${request.path}?${new URLSearchParams(request.query as Record<string, string>).toString()}`
    console.log('Starting storage request', requestUrl)
    const response = await this.oneBlinkHttpHandler.handleRequest(request)
    console.log('Finished storage request', requestUrl)

    const oneblinkResponse = response.headers['x-oneblink-response']
    if (typeof oneblinkResponse === 'string') {
      this.oneblinkResponse = JSON.parse(oneblinkResponse)
    }

    if (response.statusCode >= 400) {
      this.failResponse =
        await this.oneBlinkHttpHandler.handleFailResponse(response)
    }

    return {
      response,
    }
  }

  async sendS3Command<O>(sender: () => Promise<O>): Promise<O> {
    try {
      return await sender()
    } catch (error) {
      if (this.failResponse) {
        throw new OneBlinkStorageError(this.failResponse.message, {
          httpStatusCode: this.failResponse.statusCode,
          originalError: error instanceof Error ? error : undefined,
        })
      }
      throw error
    }
  }
}
