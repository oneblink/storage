import { IOneBlinkRequestHandler } from './types'
import { HttpRequest, HttpResponse } from '@smithy/protocol-http'

export async function prepareRequest<T>(
  oneBlinkRequestHandler: IOneBlinkRequestHandler<T>,
  request: HttpRequest,
) {
  const token = await oneBlinkRequestHandler.getIdToken()
  if (token) {
    request.headers['x-oneblink-authorization'] = 'Bearer ' + token
  }
  if (oneBlinkRequestHandler.requestBodyHeader) {
    request.headers['x-oneblink-request-body'] = JSON.stringify(
      oneBlinkRequestHandler.requestBodyHeader,
    )
  }
  if (oneBlinkRequestHandler.oneblinkResponse) {
    request.query['key'] = oneBlinkRequestHandler.oneblinkResponse.s3.key
  }

  console.log('S3 upload request', request)
}

export async function handleResponse<T>(
  oneBlinkRequestHandler: IOneBlinkRequestHandler<T>,
  request: HttpRequest,
  response: HttpResponse,
) {
  console.log('S3 upload result for request path', request.path, response)

  const oneblinkResponse = response.headers['x-oneblink-response']
  if (typeof oneblinkResponse === 'string') {
    oneBlinkRequestHandler.oneblinkResponse = JSON.parse(oneblinkResponse)
  }
}