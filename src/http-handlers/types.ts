import { StorageConstructorOptions } from '../types'
import { AWSTypes } from '@oneblink/types'

export type RequestBodyHeader = Record<string, unknown>

export type OneBlinkResponse<T> = T & {
  s3: AWSTypes.S3Configuration
}
export type FailResponse = {
  statusCode: number
  message: string
}

export interface IOneBlinkRequestHandler<T> {
  getIdToken: StorageConstructorOptions['getIdToken']
  requestBodyHeader?: RequestBodyHeader
  oneblinkResponse?: OneBlinkResponse<T>
  failResponse?: {
    statusCode: number
    message: string
  }
  determineQueueSize: () => number
}
