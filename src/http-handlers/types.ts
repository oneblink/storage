import { GetObjectCommandOutput } from '@aws-sdk/client-s3'
import { AWSTypes } from '@oneblink/types'
import { HttpRequest, HttpResponse } from '@smithy/protocol-http'
import { HttpHandlerOptions } from '@smithy/types'

export type RequestBodyHeader = Record<string, unknown>

export type OneBlinkResponse<T> = T & {
  s3: AWSTypes.S3Configuration
}
export type FailResponse = {
  statusCode: number
  message: string
}

export interface IOneBlinkHttpHandler {
  handleRequest: (
    request: HttpRequest,
    options?: HttpHandlerOptions,
  ) => Promise<HttpResponse>
  parseGetObjectCommandOutputAsJson: <T>(
    getObjectCommandOutput: GetObjectCommandOutput,
  ) => Promise<T | undefined>
  handleFailResponse: (
    response: HttpResponse,
  ) => Promise<FailResponse | undefined>
  determineUploadQueueSize: () => number
}
